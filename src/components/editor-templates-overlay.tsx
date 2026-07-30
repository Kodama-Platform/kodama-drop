import { useEffect } from "react";
import { X } from "lucide-react";

import { NOTE_TEMPLATES, type NoteTemplate } from "@/lib/note-templates";

type EditorTemplatesOverlayProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (template: NoteTemplate) => void;
};

/** Full-screen templates picker opened from the status bar. */
export function EditorTemplatesOverlay({
  open,
  onClose,
  onSelect,
}: EditorTemplatesOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="editor-templates-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Note templates"
      data-editor-templates-overlay="true"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="editor-templates-panel relative z-10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-light tracking-tight text-foreground">
              Templates
            </h2>
            <p className="mt-0.5 text-xs font-light text-muted-foreground">
              Start from a structure, or keep a blank page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="note-toolbar-btn !h-8 !w-8 !px-0"
            aria-label="Close templates"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="editor-template-grid">
          {NOTE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="editor-template-card"
              onClick={() => {
                onSelect(template);
                onClose();
              }}
            >
              <strong>{template.label}</strong>
              <span>{template.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
