import { useEffect, useRef } from "react";
import type { Conversation, Message } from "@/features/talk/types";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { MessageFragment } from "@/features/talk/components/message-fragment";
import { DropComposer } from "@/features/talk/components/drop-composer";
import { PrivacyStatus } from "@/features/talk/components/privacy-status";
import { getTalkSecurity } from "@/features/talk/security/talk-security-adapter";

/** The Stream — the same focused page for every conversation kind. */
export function ConversationStream({
  conversation,
  messages,
  busy = false,
  onSend,
}: {
  conversation: Conversation;
  messages: Message[];
  busy?: boolean;
  onSend: (body: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="conversation-stream">
      <header className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
        <PlaceMark mark={conversation.mark} size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="talk-display truncate text-lg text-foreground">{conversation.title}</h1>
          {conversation.subtitle && (
            <p className="truncate font-mono text-[0.72rem] text-muted-foreground/75">
              {conversation.subtitle}
            </p>
          )}
        </div>
        <PrivacyStatus status={getTalkSecurity().describePrivacy()} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-6">
        {messages.length === 0 ? (
          <div className="m-auto max-w-sm text-center">
            <p className="talk-display text-lg text-foreground">A quiet start</p>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Nothing here yet. Say the first thing — it will settle into place.
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageFragment key={m.id} message={m} />)
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/50 p-4">
        <DropComposer placeholder="Write a reply…" cta="Send" busy={busy} onSend={(b) => onSend(b)} />
      </div>
    </div>
  );
}
