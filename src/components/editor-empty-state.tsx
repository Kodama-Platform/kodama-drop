import { NOTE_TEMPLATES, type NoteTemplate } from "@/lib/note-templates";

const STARTERS: { id: string; label: string }[] = [
  { id: "meeting", label: "Meeting" },
  { id: "journal", label: "Journal" },
  { id: "checklist", label: "Checklist" },
  { id: "decision", label: "Decision" },
];

type EditorEmptyStateProps = {
  onSelect: (template: NoteTemplate) => void;
};

/**
 * Template suggestions that sit under the live editor placeholder —
 * one blank-page experience: start writing, or pick a starter.
 */
export function EditorEmptyState({ onSelect }: EditorEmptyStateProps) {
  return (
    <div className="editor-empty-state" data-editor-empty-state="true">
      <p className="editor-empty-hint">
        Type <kbd>/</kbd> for commands, or select text to format.
      </p>
      <div className="editor-template-grid" role="list" aria-label="Note starters">
        {STARTERS.map(({ id, label }) => {
          const template = NOTE_TEMPLATES.find((t) => t.id === id);
          if (!template) return null;
          return (
            <button
              key={id}
              type="button"
              role="listitem"
              className="editor-template-card"
              onClick={() => onSelect(template)}
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
