import { useState } from "react";
import { CornerUpLeft, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/features/talk/types";
import { AttachmentPreview } from "@/features/talk/components/attachment-preview";
import { ThreadReferenceView } from "@/features/talk/components/thread-reference";
import { relativeTime } from "@/features/talk/lib/time";

const QUICK = ["🌿", "✨", "🙏", "🔥", "👀"];

export function MessageFragment({
  message,
  onReact,
  onReply,
}: {
  message: Message;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
}) {
  const [pick, setPick] = useState(false);
  return (
    <div className="group/msg flex flex-col" data-testid="message-fragment" data-from-owner={message.fromOwner}>
      <div className={cn("talk-fragment", message.fromOwner ? "talk-fragment--out" : "talk-fragment--in")}>
        {message.replyTo && <ThreadReferenceView reference={message.replyTo} />}
        {!message.fromOwner && (
          <p className="mb-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground/70">
            {message.authorLabel}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        {message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.attachments.map((a) => (
              <AttachmentPreview key={a.id} attachment={a} />
            ))}
          </div>
        )}
        <p className="mt-1 text-right font-mono text-[0.62rem] text-muted-foreground/60">
          {relativeTime(message.createdAt)}
        </p>
      </div>

      <div
        className={cn(
          "mt-1 flex items-center gap-1.5",
          message.fromOwner ? "justify-end" : "justify-start",
        )}
      >
        {message.reactions.length > 0 && (
          <div className="flex gap-1">
            {Object.entries(
              message.reactions.reduce<Record<string, number>>((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                return acc;
              }, {}),
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact?.(emoji)}
                className="rounded-full border border-border/60 bg-card/60 px-1.5 py-0.5 text-[0.72rem]"
                data-testid={`reaction-${emoji}`}
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center opacity-0 transition-opacity group-hover/msg:opacity-100">
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
                    onClick={() => {
                      onReact?.(e);
                      setPick(false);
                    }}
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
  );
}
