import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/features/talk/types";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { relativeTime } from "@/features/talk/lib/time";

const KIND_LABEL: Record<Conversation["kind"], string> = {
  drop: "Drop",
  direct: "Direct",
  group: "Group",
  channel: "Channel",
};

/** One row in a conversation list (Shelf / stream index). */
export function ConversationRow({
  conversation,
  active = false,
  onOpen,
}: {
  conversation: Conversation;
  active?: boolean;
  onOpen?: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn("talk-row", active && "talk-row--active")}
      onClick={() => onOpen?.(conversation.id)}
      data-testid={`conversation-row-${conversation.id}`}
    >
      <PlaceMark mark={conversation.mark} size={42} />
      <span className="talk-row-body">
        <span className="flex items-center gap-1.5">
          {conversation.pinned && (
            <Pin className="h-3 w-3 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
          )}
          <span className="talk-row-title">{conversation.title}</span>
        </span>
        <span className="talk-row-preview">{conversation.lastMessagePreview}</span>
      </span>
      <span className="talk-row-meta">
        <span>{relativeTime(conversation.lastMessageAt)}</span>
        {conversation.unreadCount > 0 ? (
          <span className="talk-unread" data-testid="unread-count">
            {conversation.unreadCount}
          </span>
        ) : (
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground/50">
            {KIND_LABEL[conversation.kind]}
          </span>
        )}
      </span>
    </button>
  );
}
