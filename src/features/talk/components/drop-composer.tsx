import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/features/talk/types";
import { Markdown } from "@/features/talk/lib/markdown";
import { talkService } from "@/features/talk/services";

/** Drop / message composer. Send in seconds — Enter to send, Shift+Enter newline. */
export function DropComposer({
  placeholder = "Drop a message…",
  labelPlaceholder,
  showLabel = false,
  busy = false,
  cta = "Send",
  attachments = [],
  onSend,
  className,
  draftKey,
}: {
  placeholder?: string;
  labelPlaceholder?: string;
  showLabel?: boolean;
  busy?: boolean;
  cta?: string;
  attachments?: Attachment[];
  onSend: (body: string, fromLabel?: string) => void;
  className?: string;
  draftKey?: string;
}) {
  const [body, setBody] = useState(() => (draftKey ? talkService.getDraft(draftKey) : ""));
  const [label, setLabel] = useState("");
  const [preview, setPreview] = useState(false);

  // Switching conversations: load that conversation's saved draft.
  useEffect(() => {
    if (!draftKey) return;
    setBody(talkService.getDraft(draftKey));
    setPreview(false);
  }, [draftKey]);

  const hasBody = body.trim().length > 0;

  const change = (value: string) => {
    setBody(value);
    if (draftKey) talkService.saveDraft(draftKey, value);
  };

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed || busy) return;
    onSend(trimmed, showLabel ? label.trim() || undefined : undefined);
    if (draftKey) talkService.saveDraft(draftKey, "");
    setBody("");
    setPreview(false);
  };

  return (
    <div className={cn("talk-composer", className)} data-testid="drop-composer">
      {showLabel && (
        <input
          className="w-full border-b border-border/50 bg-transparent px-4 py-2.5 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/45"
          placeholder={labelPlaceholder ?? "How should they know you? (optional)"}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          data-testid="drop-composer-label"
        />
      )}
      {preview && hasBody ? (
        <div className="px-4 pt-3.5 pb-1" data-testid="drop-composer-preview">
          <Markdown text={body.trim()} className="md text-[0.975rem] font-light leading-relaxed text-foreground" />
        </div>
      ) : (
        <textarea
          className="talk-composer-field"
          placeholder={placeholder}
          value={body}
          rows={2}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          data-testid="drop-composer-field"
        />
      )}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-1">
          {attachments.map((a) => (
            <span key={a.id} className="font-mono text-[0.7rem] text-muted-foreground">
              {a.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        {hasBody ? (
          <div className="flex items-center gap-2 pl-1" data-testid="drop-composer-writemode">
            <button type="button" className="door-sign !text-[0.82rem]" data-active={!preview} onClick={() => setPreview(false)} data-testid="drop-composer-write-tab">Write</button>
            <span className="text-muted-foreground/30">·</span>
            <button type="button" className="door-sign !text-[0.82rem]" data-active={preview} onClick={() => setPreview(true)} data-testid="drop-composer-preview-tab">Preview</button>
          </div>
        ) : (
          <span className="font-mono text-[0.66rem] text-muted-foreground/60">
            Enter to send · Shift+Enter for a new line
          </span>
        )}
        <button
          type="button"
          className="btn-moss !px-4 !py-2 text-sm disabled:opacity-50"
          onClick={submit}
          disabled={busy || !body.trim()}
          data-testid="drop-composer-send"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
          {cta}
        </button>
      </div>
    </div>
  );
}
