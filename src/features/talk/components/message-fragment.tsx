import { useState } from "react";
import { CornerUpLeft, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/features/talk/types";
import { AttachmentPreview } from "@/features/talk/components/attachment-preview";
import { ThreadReferenceView } from "@/features/talk/components/thread-reference";
import { relativeTime } from "@/features/talk/lib/time";
import { Markdown } from "@/features/talk/lib/markdown";

const QUICK = ["🌿", "✨", "🙏", "🔥", "👀"];

/**
 * One fragment along the Conversation Trail. Clustering props control the trail
 * stem/node and whether the author name is shown (once per cluster).
 */
export function MessageFragment({
  message,
  showAuthor = true,
  clusterStart = false,
  onReact,
  onReply,
  onJump,
}: {
  message: Message;
  showAuthor?: boolean;
  clusterStart?: boolean;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onJump?: (messageId: string) => void;
}) {
  const [pick, setPick] = useState(false);
  const owner = message.fromOwner;

  const grouped = Object.entries(
    message.reactions.reduce<Record<string, number>>((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
      return acc;
    }, {}),
  );

  return (
    <div
      id={`msg-${message.id}`}
      className={cn("trail-row group/msg", clusterStart && "is-cluster")}
      data-testid="message-fragment"
      data-from-owner={owner}
    >
      <div className="trail-gutter" aria-hidden="true">
        <span className="trail-stem" />
        {showAuthor && <span className={cn("trail-node", owner ? "trail-node--out" : "trail-node--in")} />}
      </div>

      <div className="trail-content">
        {showAuthor && (
          <p className={cn("trail-author", owner && "trail-author--out")} data-testid="fragment-author">
            {owner ? "You" : message.authorLabel}
          </p>
        )}

        {message.replyTo && <ThreadReferenceView reference={message.replyTo} onJump={onJump} />}

        <div className={cn("trail-fragment", owner ? "trail-fragment--out" : "trail-fragment--in")}>
          <Markdown text={message.body} className="md break-words" />
          {message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.attachments.map((a) => (
                <AttachmentPreview key={a.id} attachment={a} />
              ))}
            </div>
          )}
          {grouped.length > 0 && (
            <div className="trail-reactions">
              {grouped.map(([emoji, count]) => (
                <button
                  key={emoji}
                  type="button"
                  className="trail-reaction"
                  onClick={() => onReact?.(emoji)}
                  data-testid={`reaction-${emoji}`}
                >
                  {emoji}
                  {count > 1 && <span className="trail-reaction-count">{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="trail-meta">
          <span className="trail-time">{relativeTime(message.createdAt)}</span>
          <div className="trail-actions opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setPick((v) => !v)}
                aria-label="React"
                data-testid="react-toggle"
              >
                <Smile className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              {pick && (
                <div className="absolute bottom-7 left-0 z-20 flex gap-1 rounded-full border border-border/70 bg-card px-2 py-1 shadow-card">
                  {QUICK.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="text-base transition-transform hover:scale-125"
                      onClick={() => { onReact?.(e); setPick(false); }}
                      data-testid={`react-${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {onReply && (
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                onClick={onReply}
                aria-label="Reply"
                data-testid="reply-toggle"
              >
                <CornerUpLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
