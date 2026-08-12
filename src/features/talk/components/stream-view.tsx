import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Archive,
  BellOff,
  Bell,
  Lock,
  Pin,
  PinOff,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { talkService } from "@/features/talk/services";
import type { Attachment, Conversation, Message, ThreadReference } from "@/features/talk/types";
import { getTalkSecurity } from "@/features/talk/security/talk-security-adapter";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { PrivacyStatus } from "@/features/talk/components/privacy-status";
import { DropComposer } from "@/features/talk/components/drop-composer";
import { MessageFragment } from "@/features/talk/components/message-fragment";
import { TalkLoading } from "@/features/talk/components/states";

export function StreamView({
  conversation,
  onBack,
  onChanged,
  onInvite,
}: {
  conversation: Conversation;
  onBack?: () => void;
  onChanged?: () => void;
  onInvite?: (c: Conversation) => void;
}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [reply, setReply] = useState<ThreadReference | null>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seenUnread = useRef<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    setMessages(null);
    if (!(conversation.id in seenUnread.current)) {
      seenUnread.current[conversation.id] = conversation.unreadCount;
    }
    void talkService.listMessages(conversation.id).then((m) => alive && setMessages(m));
    void talkService.markRead(conversation.id);
    return () => {
      alive = false;
    };
  }, [conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  const jumpTo = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("trail-flash");
    window.setTimeout(() => el.classList.remove("trail-flash"), 1300);
  };

  const canSend = useMemo(() => {
    if (conversation.state === "locked" || conversation.state === "archived") return false;
    if (conversation.kind === "channel" && conversation.replyPolicy === "off") return false;
    return true;
  }, [conversation]);

  const send = async (body: string, keepsakes?: Attachment[]) => {
    setBusy(true);
    try {
      const m = await talkService.sendMessage({ conversationId: conversation.id, body, replyTo: reply ?? undefined, attachments: keepsakes });
      setMessages((prev) => [...(prev ?? []), m]);
      setReply(null);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const react = async (id: string, emoji: string) => {
    await talkService.addReaction(id, emoji);
    setMessages(await talkService.listMessages(conversation.id));
  };

  const togglePin = async () => {
    await talkService.setPinned(conversation.id, !conversation.pinned);
    conversation.pinned = !conversation.pinned;
    onChanged?.();
  };
  const toggleMute = async () => {
    await talkService.setMuted(conversation.id, !conversation.muted);
    conversation.muted = !conversation.muted;
    onChanged?.();
  };
  const archive = async () => {
    await talkService.setArchived(conversation.id, true);
    toast.success("Conversation archived");
    onChanged?.();
    onBack?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="stream-view">
      <header className="flex items-center gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
        {onBack && (
          <button type="button" onClick={onBack} className="talk-pill !px-2.5 !py-2 lg:hidden" aria-label="Back" data-testid="stream-back">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
        <PlaceMark mark={conversation.mark} size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="talk-display truncate text-lg text-foreground" data-testid="stream-title">
            {conversation.title}
          </h1>
          <p className="truncate font-mono text-[0.7rem] text-muted-foreground/75" data-testid="stream-purpose">
            {conversation.kind === "direct"
              ? streamPurpose(conversation.kind)
              : conversation.subtitle ?? streamPurpose(conversation.kind)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(conversation.kind === "group" || conversation.kind === "channel") && onInvite && (
            <IconBtn label="Invite" onClick={() => onInvite(conversation)} testid="stream-invite">
              <UserPlus className="h-4 w-4" strokeWidth={1.5} />
            </IconBtn>
          )}
          <IconBtn label={conversation.muted ? "Unmute" : "Mute"} onClick={toggleMute} testid="stream-mute">
            {conversation.muted ? <BellOff className="h-4 w-4" strokeWidth={1.5} /> : <Bell className="h-4 w-4" strokeWidth={1.5} />}
          </IconBtn>
          <IconBtn label={conversation.pinned ? "Unpin" : "Pin"} onClick={togglePin} testid="stream-pin">
            {conversation.pinned ? <PinOff className="h-4 w-4" strokeWidth={1.5} /> : <Pin className="h-4 w-4" strokeWidth={1.5} />}
          </IconBtn>
          <IconBtn label="Archive" onClick={archive} testid="stream-archive">
            <Archive className="h-4 w-4" strokeWidth={1.5} />
          </IconBtn>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6">
        {messages === null ? (
          <TalkLoading label="Opening the trail…" />
        ) : messages.length === 0 ? (
          <div className="m-auto max-w-sm text-center">
            <p className="talk-display text-lg text-foreground">A quiet start</p>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Nothing left here yet. Leave the first message — it will settle into place.
            </p>
          </div>
        ) : (
          <div className="trail mx-auto w-full max-w-2xl">
            <FirstDropContext message={messages[0]} kind={conversation.kind} />
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const sameSpeaker = !!prev && prev.fromOwner === m.fromOwner && prev.authorLabel === m.authorLabel;
              const unread = seenUnread.current[conversation.id] ?? 0;
              const isUnreadStart = unread > 0 && i === Math.max(0, messages.length - unread);
              return (
                <div key={m.id}>
                  {isUnreadStart && (
                    <div className="trail-new" data-testid="trail-new">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember shadow-[0_0_8px_1px_rgb(var(--ember)/0.55)]" />
                      new
                    </div>
                  )}
                  <MessageFragment
                    message={m}
                    showAuthor={!sameSpeaker}
                    clusterStart={!sameSpeaker && i > 0}
                    onReact={(e) => void react(m.id, e)}
                    onReply={
                      canSend
                        ? () => setReply({ messageId: m.id, authorLabel: m.authorLabel, excerpt: m.body.slice(0, 48) })
                        : undefined
                    }
                    onJump={jumpTo}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/50 p-3 sm:p-4">
        {reply && (
          <div className="trail-echo mb-2 flex items-center justify-between !border-l-2 !border-primary/40 py-1.5 pr-2" data-testid="reply-banner">
            <span className="truncate text-xs font-light text-muted-foreground">
              Echoing <span className="text-foreground">{reply.authorLabel}</span> · {reply.excerpt}
            </span>
            <button type="button" onClick={() => setReply(null)} aria-label="Cancel reply">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
        {canSend ? (
          <DropComposer placeholder="Leave a message…" cta="Send" busy={busy} allowImages draftKey={conversation.id} onSend={(b, _l, atts) => void send(b, atts)} />
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/40 py-3 text-sm text-muted-foreground" data-testid="stream-locked">
            <Lock className="h-4 w-4" strokeWidth={1.5} />
            {conversation.state === "locked"
              ? "This message can't be replied to."
              : conversation.state === "archived"
                ? "Archived — unarchive to leave a message."
                : "This is a read-only channel."}
          </div>
        )}
      </div>
    </div>
  );
}

function FirstDropContext({ message, kind }: { message: Message; kind: Conversation["kind"] }) {
  if (message.fromOwner) return null;
  const label = message.authorLabel.trim();
  const anon = /^(someone|anonymous|guest)$/i.test(label);
  const text =
    kind === "direct"
      ? anon
        ? "An anonymous message left here"
        : `A message left here by ${label}`
      : anon
        ? "Left here anonymously"
        : `${label} left the first message here`;
  return (
    <p className="trail-origin" data-testid="trail-origin">
      {text}
    </p>
  );
}

function streamPurpose(kind: Conversation["kind"]): string {
  switch (kind) {
    case "group": return "A private, invite-only group";
    case "channel": return "A channel for updates";
    default: return "A private conversation that began with a Drop";
  }
}

function IconBtn({
  children,
  label,
  onClick,
  testid,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      data-testid={testid}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground"
    >
      {children}
    </button>
  );
}
