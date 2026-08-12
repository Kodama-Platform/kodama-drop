import { CornerUpLeft } from "lucide-react";
import type { ThreadReference } from "@/features/talk/types";

/** Reply echo — a quiet reference to an earlier message. Tap to jump to it. */
export function ThreadReferenceView({ reference, onJump }: { reference: ThreadReference; onJump?: (messageId: string) => void }) {
  return (
    <button
      type="button"
      className="trail-echo"
      data-testid="thread-reference"
      onClick={() => onJump?.(reference.messageId)}
      title={`Jump to ${reference.authorLabel}'s message`}
    >
      <CornerUpLeft className="h-3 w-3 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden="true" />
      <span className="trail-echo-text">
        <span className="font-medium text-foreground/70">{reference.authorLabel}</span> {reference.excerpt}
      </span>
    </button>
  );
}
