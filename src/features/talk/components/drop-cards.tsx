import { useState } from "react";
import { Ban, Check, CornerUpLeft, EyeOff, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";

import { talkService } from "@/features/talk/services";
import type { Conversation, Drop } from "@/features/talk/types";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { AttachmentPreview } from "@/features/talk/components/attachment-preview";
import { SentDropState } from "@/features/talk/components/sent-drop-state";
import { markFor } from "@/features/talk/lib/mark";
import { relativeTime } from "@/features/talk/lib/time";

function OriginBadge({ drop }: { drop: Drop }) {
  if (drop.origin === "anonymous")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground/70">
        <EyeOff className="h-3 w-3" /> anonymous
      </span>
    );
  if (drop.origin === "place")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-primary/80">
        <MapPin className="h-3 w-3" /> talk.kodama.page/{drop.fromAddress}
      </span>
    );
  return (
    <span className="font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground/70">named</span>
  );
}

/** Incoming Drop with reply / decline / block. Reply converts to a Direct Talk. */
export function DropCard({ drop, onOpen }: { drop: Drop; onOpen: (c: Conversation) => void }) {
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState<Drop["status"] | null>(null);

  const status = resolved ?? drop.status;
  if (status === "declined" || status === "blocked") {
    return (
      <div className="talk-surface flex items-center gap-3 px-4 py-3 opacity-60" data-testid={`drop-resolved-${drop.id}`}>
        <PlaceMark mark={drop.origin === "place" ? markFor(drop.fromLabel, drop.fromAddress!) : markFor(drop.fromLabel, drop.id)} size={34} />
        <span className="flex-1 truncate text-sm text-muted-foreground">{drop.fromLabel} · {status}</span>
      </div>
    );
  }

  const reply = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const conv = await talkService.replyToDrop(drop.id, body.trim());
      toast.success("Reply sent — this is now a Direct Talk");
      onOpen(conv);
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    await talkService.declineDrop(drop.id);
    setResolved("declined");
    toast("Drop declined");
  };
  const block = async () => {
    await talkService.blockDrop(drop.id);
    setResolved("blocked");
    toast("Sender blocked");
  };

  return (
    <div className="talk-surface p-4" data-testid={`drop-card-${drop.id}`}>
      <div className="flex items-start gap-3">
        <PlaceMark
          mark={drop.origin === "place" && drop.fromAddress ? markFor(drop.fromLabel, drop.fromAddress) : markFor(drop.fromLabel, drop.id)}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="talk-display text-base text-foreground">{drop.fromLabel}</span>
            <span className="font-mono text-[0.66rem] text-muted-foreground/70">{relativeTime(drop.createdAt)}</span>
          </div>
          <div className="mt-0.5"><OriginBadge drop={drop} /></div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm font-light leading-relaxed text-foreground/90">
            {drop.body}
          </p>
          {drop.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {drop.attachments.map((a) => (
                <AttachmentPreview key={a.id} attachment={a} />
              ))}
            </div>
          )}
        </div>
      </div>

      {replying ? (
        <div className="mt-3">
          <textarea
            className="talk-composer-field !min-h-[3rem] rounded-lg border border-border/60"
            placeholder={`Reply to ${drop.fromLabel}…`}
            value={body}
            autoFocus
            onChange={(e) => setBody(e.target.value)}
            data-testid={`drop-reply-field-${drop.id}`}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="talk-pill" onClick={() => setReplying(false)}>Cancel</button>
            <button type="button" className="btn-moss !px-4 !py-2 text-sm disabled:opacity-50" onClick={reply} disabled={busy || !body.trim()} data-testid={`drop-reply-send-${drop.id}`}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Send reply
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-moss !px-3.5 !py-1.5 text-sm" onClick={() => setReplying(true)} data-testid={`drop-reply-${drop.id}`}>
            <CornerUpLeft className="h-3.5 w-3.5" /> Reply
          </button>
          <button type="button" className="talk-pill !py-1.5 text-sm" onClick={decline} data-testid={`drop-decline-${drop.id}`}>
            <X className="h-3.5 w-3.5" /> Decline
          </button>
          <button type="button" className="talk-pill !py-1.5 text-sm hover:!border-destructive/40 hover:!text-destructive" onClick={block} data-testid={`drop-block-${drop.id}`}>
            <Ban className="h-3.5 w-3.5" /> Block
          </button>
        </div>
      )}
    </div>
  );
}

export function SentDropCard({ drop }: { drop: Drop }) {
  return (
    <div className="talk-surface flex items-start gap-3 p-4" data-testid={`sent-drop-${drop.id}`}>
      <PlaceMark mark={markFor(drop.toAddress, drop.toAddress)} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-foreground">to talk.kodama.page/{drop.toAddress}</span>
          <SentDropState status={drop.status} />
        </div>
        <p className="mt-1 truncate text-sm font-light text-muted-foreground">{drop.body}</p>
        <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground/70">
          {drop.origin === "place" ? `from talk.kodama.page/${drop.fromAddress}` : drop.origin === "anonymous" ? "sent anonymously" : "sent as guest"}
        </p>
      </div>
    </div>
  );
}
