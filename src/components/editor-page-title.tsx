import { useEffect, useState } from "react";

type EditorPageTitleProps = {
  title: string;
  canEdit: boolean;
  onRename: (title: string) => void;
};

/** Editable page title for the active sheet — calm display typography. */
export function EditorPageTitle({ title, canEdit, onRename }: EditorPageTitleProps) {
  const [value, setValue] = useState(title);

  useEffect(() => {
    setValue(title);
  }, [title]);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(title);
      return;
    }
    if (trimmed !== title) onRename(trimmed);
  };

  if (!canEdit) {
    return (
      <h1
        data-editor-page-title="true"
        className="editor-page-title"
      >
        {title}
      </h1>
    );
  }

  return (
    <input
      data-editor-page-title="true"
      data-editor-chrome="true"
      className="editor-page-title editor-page-title-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
          setValue(title);
          (e.target as HTMLInputElement).blur();
        }
      }}
      maxLength={80}
      aria-label="Sheet title"
      spellCheck={false}
    />
  );
}
