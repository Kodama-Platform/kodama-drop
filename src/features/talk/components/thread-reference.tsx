import type { ThreadReference } from "@/features/talk/types";

/** Reply anchor shown above a message fragment. */
export function ThreadReferenceView({ reference }: { reference: ThreadReference }) {
  return (
    <span className="talk-thread-ref" data-testid="thread-reference">
      <span className="font-medium text-foreground/70">{reference.authorLabel}</span>{" "}
      {reference.excerpt}
    </span>
  );
}
