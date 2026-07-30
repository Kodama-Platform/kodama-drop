import { useEffect, useState } from "react";
import { X } from "lucide-react";

const TIP_KEY = "kodama-editor-tip-dismissed";

function isMacPlatform(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function EditorWritingTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(TIP_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const mod = isMacPlatform() ? "⌘" : "Ctrl";

  return (
    <div
      data-editor-chrome="true"
      className="editor-writing-tip mb-2 flex items-start gap-2 rounded-lg border border-border/50 bg-muted/25 px-3 py-2 text-[12px] font-light leading-relaxed text-muted-foreground"
      role="status"
    >
      <p className="min-w-0 flex-1">
        Select text to format · {mod}K for commands · # for headings
      </p>
      <button
        type="button"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
        aria-label="Dismiss tip"
        onClick={() => {
          try {
            localStorage.setItem(TIP_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
