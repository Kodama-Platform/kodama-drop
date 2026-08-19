import { ArrowUpRight, Lock, Pin, Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation, Drop } from "@/features/talk/types";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { SentDropState } from "@/features/talk/components/sent-drop-state";
import { markFor } from "@/features/talk/lib/mark";
import { relativeTime } from "@/features/talk/lib/time";

/** One entry in the living stream — a conversation, an incoming Drop, or a sent Drop. */
export type StreamItem =
  | { type: "conversation"; at: string; conv: Conversation }
  | { type: "drop"; at: string; drop: Drop }
  | { type: "sent"; at: string; drop: Drop };

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function StreamItemRow({ item, active, onOpen, external = false }: { item: StreamItem; active: boolean; onOpen: () => void; external?: boolean }) {
  const rowClass = cn("talk-row", active && "talk-row--active");

  if (item.type === "drop") {
    const d = item.drop;
    const name = d.origin === "anonymous" ? "Anonymous" : d.fromLabel;
    const mark = d.origin === "place" && d.fromAddress ? markFor(d.fromLabel, d.fromAddress) : markFor(d.fromLabel, d.id);
    return (
      <button type="button" className={rowClass} onClick={onOpen} data-testid={`stream-item-drop-${d.id}`}>
        <PlaceMark mark={mark} size={42} />
        <span className="talk-row-body">
          <span className="talk-row-title">{name}</span>
          <span className="talk-row-preview">{oneLine(d.subject || d.body)}</span>
        </span>
        <span className="talk-row-meta">
          <span>{relativeTime(d.createdAt)}</span>
          <span className="talk-firefly-dot" data-testid="stream-unread" aria-label="new" />
        </span>
      </button>
    );
  }

  if (item.type === "sent") {
    const d = item.drop;
    return (
      <button type="button" className={rowClass} onClick={onOpen} data-testid={`stream-item-sent-${d.id}`}>
        <PlaceMark mark={markFor(d.toAddress, d.toAddress)} size={42} />
        <span className="talk-row-body">
          <span className="flex items-center gap-1.5">
            <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/55" strokeWidth={1.75} aria-hidden="true" />
            <span className="talk-row-title">{d.toAddress}</span>
          </span>
          <span className="talk-row-preview">You: {oneLine(d.subject || d.body)}</span>
        </span>
        <span className="talk-row-meta">
          <span>{relativeTime(d.createdAt)}</span>
          <SentDropState status={d.status} />
        </span>
      </button>
    );
  }

  const c = item.conv;
  const Cue = c.kind === "group" ? Users : c.kind === "channel" ? (c.visibility === "private" ? Lock : Radio) : null;
  return (
    <button type="button" className={rowClass} onClick={onOpen} data-testid={`stream-item-conv-${c.id}`}>
      <PlaceMark mark={c.mark} size={42} />
      <span className="talk-row-body">
        <span className="flex items-center gap-1.5">
          {c.pinned && <Pin className="h-3 w-3 shrink-0 text-primary/70" strokeWidth={2} aria-hidden="true" data-testid="pin-mark" />}
          {Cue && <Cue className="h-3 w-3 shrink-0 text-muted-foreground/55" strokeWidth={1.75} aria-hidden="true" data-testid={`cue-${c.kind}`} />}
          <span className="talk-row-title">{c.title}</span>
          {external && (
            <span className="talk-following-cue" data-testid="following-cue">following</span>
          )}
        </span>
        <span className="talk-row-preview">{c.lastMessagePreview}</span>
      </span>
      <span className="talk-row-meta">
        <span>{relativeTime(c.lastMessageAt)}</span>
        {c.unreadCount > 0 && (
          <span className="talk-unread" data-testid="unread-count">{c.unreadCount}</span>
        )}
      </span>
    </button>
  );
}
