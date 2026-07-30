import { NOTE_TEMPLATES, type NoteTemplate } from "@/lib/note-templates";

const STARTERS: { id: string; label: string }[] = [
  { id: "meeting", label: "Meeting" },
  { id: "journal", label: "Journal" },
  { id: "checklist", label: "Checklist" },
  { id: "decision", label: "Decision" },
  { id: "blank", label: "Blank" },
];

type EditorEmptyStateProps = {
  onSelect: (template: NoteTemplate) => void;
  onStartBlank?: () => void;
};

/** Centered empty-sheet starters when the active page has no content. */
export function EditorEmptyState({ onSelect, onStartBlank }: EditorEmptyStateProps) {
  return (
    <div className="editor-empty-state" data-editor-empty-state="true">
      <div>
        <h2>Begin a page</h2>
        <p>Pick a starter, or write freely on a blank page.</p>
      </div>
      <div className="editor-template-grid">
        {STARTERS.map(({ id, label }) => {
          const template = NOTE_TEMPLATES.find((t) => t.id === id);
          if (!template) return null;
          return (
            <button
              key={id}
              type="button"
              className="editor-template-card"
              onClick={() => {
                if (id === "blank") {
                  onStartBlank?.();
                  return;
                }
                onSelect(template);
              }}
            >
              <strong>{label}</strong>
              <span>{template.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
