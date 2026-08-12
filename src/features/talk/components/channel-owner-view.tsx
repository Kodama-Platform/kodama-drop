import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Reply, Share2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { TALK } from "@/lib/brand";
import { talkService } from "@/features/talk/services";
import type { ChannelReply, Conversation, Message } from "@/features/talk/types";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { MessageFragment } from "@/features/talk/components/message-fragment";
import { DropComposer } from "@/features/talk/components/drop-composer";
import { TalkLoading } from "@/features/talk/components/states";
import { copyText } from "@/features/talk/lib/clipboard";
import { relativeTime } from "@/features/talk/lib/time";

const MODE_LABEL: Record<string, string> = {
  "read-only": "Read only",
  reviewed: "Replies reviewed",
  open: "Replies open",
  members: "Members reply",
  "private-contact": "Private contact",
};

export function ChannelOwnerView({ conversation, onBack, onChanged, onInvite, onOpenConversation }: {
  conversation: Conversation;
  onBack?: () => void;
  onChanged?: () => void;
  onInvite?: (c: Conversation) => void;
  onOpenConversation?: (c: Conversation) => void;
}) {
  const [posts, setPosts] = useState<Message[] | null>(null);
  const [pending, setPending] = useState<ChannelReply[]>([]);
  const [busy, setBusy] = useState(false);
  const slug = conversation.channelSlug ?? "";
  const url = `${TALK.url}/${conversation.placeAddress}/${slug}`;

  const load = async () => {
    setPosts(await talkService.listMessages(conversation.id));
    setPending(await talkService.listPendingReplies(conversation.id));
  };
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [conversation.id]);

  const post = async (body: string, atts?: Message["attachments"]) => {
    setBusy(true);
    try {
      await talkService.sendMessage({ conversationId: conversation.id, body, attachments: atts });
      await load();
      onChanged?.();
    } finally { setBusy(false); }
  };

  const shareChannel = async () => {
    const ok = await copyText(url);
    toast[ok ? "success" : "error"](ok ? "Channel link copied" : url);
  };

  const inviteLink = async () => {
    const inv = await talkService.createInvite(conversation.id);
    const link = `${url}?invite=${inv.code}`;
    const ok = await copyText(link);
    toast[ok ? "success" : "error"](ok ? "Invite link copied — one tap to join" : link);
  };

  const canPost = conversation.replyPolicy !== "private-contact";

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="channel-owner-view">
      <header className="flex items-center gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
        {onBack && (
          <button type="button" onClick={onBack} className="talk-pill !px-2.5 !py-2 lg:hidden" aria-label="Back" data-testid="detail-back">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
        <PlaceMark mark={conversation.mark} size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="talk-display truncate text-lg text-foreground" data-testid="channel-owner-title">{conversation.title}</h1>
          <p className="truncate font-mono text-[0.7rem] text-muted-foreground/75">
            {TALK.domain}/{conversation.placeAddress}/{slug} · {MODE_LABEL[conversation.replyPolicy ?? "reviewed"]}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/8 hover:text-foreground" aria-label="Open public page" title="Open public page" data-testid="channel-open-public">
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/8 hover:text-foreground" aria-label="Share channel" title="Share channel" onClick={shareChannel} data-testid="channel-share">
            <Share2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {conversation.visibility === "private" && (
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/8 hover:text-foreground" aria-label="Invite" title="Invite link" onClick={inviteLink} data-testid="channel-invite">
              <UserPlus className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {pending.length > 0 && (
            <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4" data-testid="review-queue">
              <p className="mb-3 flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Replies waiting for review · {pending.length}
              </p>
              <div className="space-y-3">
                {pending.map((r) => (
                  <ReviewItem key={r.id} reply={r} onDone={load} onOpenConversation={onOpenConversation} onChanged={onChanged} />
                ))}
              </div>
            </section>
          )}

          {posts === null ? (
            <TalkLoading label="Opening the channel…" />
          ) : posts.length === 0 ? (
            <div className="m-auto max-w-sm text-center">
              <p className="talk-display text-lg text-foreground">Nothing posted yet</p>
              <p className="mt-2 text-sm font-light text-muted-foreground">Share your first update below — followers will see it on the public page.</p>
            </div>
          ) : (
            <div className="trail">
              {posts.map((m, i) => {
                const prev = posts[i - 1];
                const same = !!prev && prev.authorLabel === m.authorLabel && prev.fromOwner === m.fromOwner;
                return <MessageFragment key={m.id} message={m} showAuthor={!same} clusterStart={!same && i > 0} />;
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/50 p-3 sm:p-4">
        {canPost ? (
          <DropComposer placeholder="Share an update…" cta="Post" busy={busy} allowImages draftKey={`post-${conversation.id}`} onSend={(b, _l, atts) => void post(b, atts)} />
        ) : (
          <p className="text-center text-sm font-light text-muted-foreground">This channel is private-contact only — people reach you as Drops in your Shelf.</p>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ reply, onDone, onOpenConversation, onChanged }: {
  reply: ChannelReply;
  onDone: () => Promise<void> | void;
  onOpenConversation?: (c: Conversation) => void;
  onChanged?: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const canReplyPrivately = reply.origin === "place" && !!reply.fromAddress;

  const publish = async () => { await talkService.publishReply(reply.id); toast.success("Published to the channel"); await onDone(); onChanged?.(); };
  const decline = async () => { await talkService.declineReply(reply.id); toast("Reply declined"); await onDone(); };
  const sendPrivate = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const conv = await talkService.replyPrivatelyToReply(reply.id, body.trim());
      toast.success(`Started a Direct Talk with ${reply.fromLabel}`);
      await onDone();
      onChanged?.();
      onOpenConversation?.(conv);
    } catch {
      toast.error("Couldn't start a private reply");
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-3" data-testid="review-item">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-foreground">
          {reply.origin === "anonymous" ? "Anonymous" : reply.fromLabel}
          {reply.origin === "anonymous" && <span className="ml-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground/70">one-way</span>}
        </p>
        <span className="font-mono text-[0.62rem] text-muted-foreground/70">{relativeTime(reply.createdAt)}</span>
      </div>
      {reply.fromAddress && <p className="font-mono text-[0.62rem] text-primary">from {TALK.domain}/{reply.fromAddress}</p>}
      <p className="mt-1.5 break-words text-sm font-light leading-relaxed text-foreground/90">{reply.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-moss !px-3 !py-1.5 text-xs" onClick={publish} data-testid="review-publish">Publish</button>
        {canReplyPrivately && (
          <button type="button" className="talk-pill !px-3 !py-1.5 text-xs" onClick={() => setReplying((v) => !v)} data-testid="review-reply-private">
            <Reply className="h-3.5 w-3.5" /> Reply privately
          </button>
        )}
        <button type="button" className="talk-pill !px-3 !py-1.5 text-xs hover:!border-ember/40 hover:!text-ember" onClick={decline} data-testid="review-decline">
          <Trash2 className="h-3.5 w-3.5" /> Decline
        </button>
      </div>
      {replying && (
        <div className="mt-3">
          <textarea className="door-writing !min-h-[4.5rem]" placeholder={`Reply privately to ${reply.fromLabel}…`} value={body} onChange={(e) => setBody(e.target.value)} data-testid="review-private-input" />
          <button type="button" className="btn-moss mt-2 w-full justify-center disabled:opacity-50" onClick={sendPrivate} disabled={busy || !body.trim()} data-testid="review-private-send">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />} Start Direct Talk
          </button>
        </div>
      )}
    </div>
  );
}
