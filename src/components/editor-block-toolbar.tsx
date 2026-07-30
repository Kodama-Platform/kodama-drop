import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  SquareCode,
  Table,
} from "lucide-react";

type EditorBlockToolbarProps = {
  editor: Editor | null;
  disabled?: boolean;
};

/** Always-visible block insert strip (no selection required). */
export function EditorBlockToolbar({
  editor,
  disabled = false,
}: EditorBlockToolbarProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  if (!editor || disabled) return null;

  return (
    <div
      data-editor-chrome="true"
      data-editor-block-toolbar="true"
      className="editor-block-toolbar"
      role="toolbar"
      aria-label="Insert blocks"
    >
      <div className="editor-format-toolbar-scroll">
        <FormatGroup>
          <FormatBtn
            label="Heading 1"
            pressed={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Heading 2"
            pressed={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Heading 3"
            pressed={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </FormatBtn>
        </FormatGroup>

        <FormatGroup>
          <FormatBtn
            label="Bulleted list"
            pressed={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Numbered list"
            pressed={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Check list"
            pressed={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListTodo className="h-3.5 w-3.5" />
          </FormatBtn>
        </FormatGroup>

        <FormatGroup>
          <FormatBtn
            label="Quote"
            pressed={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Code block"
            pressed={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <SquareCode className="h-3.5 w-3.5" />
          </FormatBtn>
        </FormatGroup>

        <FormatGroup>
          <FormatBtn
            label="Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Table"
            pressed={editor.isActive("table")}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Table className="h-3.5 w-3.5" />
          </FormatBtn>
        </FormatGroup>
      </div>
    </div>
  );
}

function FormatGroup({ children }: { children: React.ReactNode }) {
  return <div className="editor-format-group">{children}</div>;
}

function FormatBtn({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="editor-format-btn"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
