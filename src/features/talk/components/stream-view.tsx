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
import type { Conversation, Message, ThreadReference } from "@/features/talk/types";
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

  useEffect(() => {
    let alive = true;
    setMessages(null);
    void talkService.listMessages(conversation.id).then((m) => alive && setMessages(m));
    void talkService.markRead(conversation.id);
    return () => {
      alive = false;
    };
  }, [conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  const canSend = useMemo(() => {
    if (conversation.state === "locked" || conversation.state === "archived") return false;
    if (conversation.kind === "channel" && conversation.replyPolicy === "off") return false;
    return true;
  }, [conversation]);

  const send = async (body: string) => {
    setBusy(true);
    try {
      const m = await talkService.sendMessage({ conversationId: conversation.id, body, replyTo: reply ?? undefined });
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-6 sm:px-6">
        {messages === null ? (
          <TalkLoading label="Opening the stream…" />
        ) : messages.length === 0 ? (
          <div className="m-auto max-w-sm text-center">
            <p className="talk-display text-lg text-foreground">A quiet start</p>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Nothing here yet. Say the first thing — it will settle into place.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageFragment
              key={m.id}
              message={m}
              onReact={(e) => void react(m.id, e)}
              onReply={() =>
                setReply({ messageId: m.id, authorLabel: m.authorLabel, excerpt: m.body.slice(0, 48) })
              }
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/50 p-3 sm:p-4">
        {reply && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-1.5" data-testid="reply-banner">
            <span className="truncate text-xs font-light text-muted-foreground">
              Replying to <span className="text-foreground">{reply.authorLabel}</span> · {reply.excerpt}
            </span>
            <button type="button" onClick={() => setReply(null)} aria-label="Cancel reply">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
        {canSend ? (
          <DropComposer placeholder="Write a reply…" cta="Send" busy={busy} onSend={(b) => void send(b)} />
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/40 py-3 text-sm text-muted-foreground" data-testid="stream-locked">
            <Lock className="h-4 w-4" strokeWidth={1.5} />
            {conversation.state === "locked"
              ? "This conversation is locked."
              : conversation.state === "archived"
                ? "Archived — unarchive to reply."
                : "Replies are turned off in this channel."}
          </div>
        )}
      </div>
    </div>
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
