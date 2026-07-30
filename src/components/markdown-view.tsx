import { useCallback } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { toast } from "sonner";

type MarkdownViewProps = {
  markdown: string;
  sheetTitle: string;
  canEdit?: boolean;
  onChange?: (next: string) => void;
};

export function MarkdownView({
  markdown,
  sheetTitle,
  canEdit = false,
  onChange,
}: MarkdownViewProps) {
  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Markdown copied", {
        icon: <Check className="h-4 w-4" />,
      });
    } catch {
      toast.error("Couldn't copy markdown");
    }
  }, [markdown]);

  const editable = canEdit && !!onChange;

  return (
    <div
      className="markdown-view"
      data-editor-surface="true"
      aria-label={`Markdown source for ${sheetTitle}`}
    >
      <div className="markdown-view-header">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <FileCode2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Markdown
          <span className="normal-case tracking-normal text-muted-foreground/70">
            · {editable ? "edit source" : "read only"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void copyMarkdown()}
          className="note-toolbar-btn !h-7 !text-[11px]"
          title="Copy markdown"
        >
          <Copy className="h-3 w-3" />
          <span className="hidden sm:inline">Copy</span>
        </button>
      </div>
      {editable ? (
        <textarea
          className="markdown-view-source markdown-view-editor"
          value={markdown}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={`Edit markdown for ${sheetTitle}`}
        />
      ) : (
        <pre className="markdown-view-source" tabIndex={0}>
          {markdown || "(empty sheet)"}
        </pre>
      )}
    </div>
  );
}
