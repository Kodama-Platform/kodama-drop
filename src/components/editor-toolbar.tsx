import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Ellipsis,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Outdent,
  Quote,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Underline,
} from "lucide-react";

import { clearFormatting } from "@/lib/clear-formatting";

type EditorToolbarProps = {
  editor: Editor | null;
  disabled?: boolean;
  onOpenLink?: () => void;
};

function runCommand(editor: Editor, run: (chain: ReturnType<Editor["chain"]>) => void) {
  try {
    run(editor.chain().focus());
  } catch {
    // Ignore unavailable commands for the current selection/schema.
  }
}

/** Docked format bar — Structure + Inline; More expands a second row. */
export function EditorToolbar({
  editor,
  disabled = false,
  onOpenLink,
}: EditorToolbarProps) {
  const [, setTick] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

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
      data-editor-toolbar="true"
      className={`editor-toolbar${moreOpen ? " editor-toolbar--expanded" : ""}`}
      role="toolbar"
      aria-label="Formatting"
    >
      <div className="editor-toolbar-row">
        <FormatGroup>
          <FormatBtn
            label="Heading 1"
            pressed={editor.isActive("heading", { level: 1 })}
            onClick={() => runCommand(editor, (c) => c.toggleHeading({ level: 1 }).run())}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Heading 2"
            pressed={editor.isActive("heading", { level: 2 })}
            onClick={() => runCommand(editor, (c) => c.toggleHeading({ level: 2 }).run())}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Heading 3"
            pressed={editor.isActive("heading", { level: 3 })}
            onClick={() => runCommand(editor, (c) => c.toggleHeading({ level: 3 }).run())}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Bulleted list"
            pressed={editor.isActive("bulletList")}
            onClick={() => runCommand(editor, (c) => c.toggleBulletList().run())}
          >
            <List className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Numbered list"
            pressed={editor.isActive("orderedList")}
            onClick={() => runCommand(editor, (c) => c.toggleOrderedList().run())}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Check list"
            pressed={editor.isActive("taskList")}
            onClick={() => runCommand(editor, (c) => c.toggleTaskList().run())}
          >
            <ListTodo className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Quote"
            pressed={editor.isActive("blockquote")}
            onClick={() => runCommand(editor, (c) => c.toggleBlockquote().run())}
          >
            <Quote className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Code block"
            pressed={editor.isActive("codeBlock")}
            onClick={() => runCommand(editor, (c) => c.toggleCodeBlock().run())}
          >
            <SquareCode className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Table"
            pressed={editor.isActive("table")}
            onClick={() =>
              runCommand(editor, (c) =>
                c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
              )
            }
          >
            <Table className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Divider"
            onClick={() => runCommand(editor, (c) => c.setHorizontalRule().run())}
          >
            <Minus className="h-3.5 w-3.5" />
          </FormatBtn>
        </FormatGroup>

        <FormatGroup>
          <FormatBtn
            label="Bold"
            pressed={editor.isActive("bold")}
            onClick={() => runCommand(editor, (c) => c.toggleBold().run())}
          >
            <Bold className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Italic"
            pressed={editor.isActive("italic")}
            onClick={() => runCommand(editor, (c) => c.toggleItalic().run())}
          >
            <Italic className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Underline"
            pressed={editor.isActive("underline")}
            onClick={() => runCommand(editor, (c) => c.toggleUnderline().run())}
          >
            <Underline className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Highlight"
            pressed={editor.isActive("highlight")}
            onClick={() => runCommand(editor, (c) => c.toggleHighlight().run())}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn
            label="Hyperlink"
            pressed={editor.isActive("link")}
            onClick={() => onOpenLink?.()}
          >
            <Link2 className="h-3.5 w-3.5" />
          </FormatBtn>
          <FormatBtn label="Clear formatting" onClick={() => clearFormatting(editor)}>
            <RemoveFormatting className="h-3.5 w-3.5" />
          </FormatBtn>
        </FormatGroup>

        <FormatBtn
          label={moreOpen ? "Hide more formatting" : "More formatting"}
          pressed={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <Ellipsis className="h-3.5 w-3.5" />
        </FormatBtn>
      </div>

      {moreOpen && (
        <div className="editor-toolbar-row editor-toolbar-row--more" role="group" aria-label="More formatting">
          <FormatGroup>
            <FormatBtn
              label="Strikethrough"
              pressed={editor.isActive("strike")}
              onClick={() => runCommand(editor, (c) => c.toggleStrike().run())}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </FormatBtn>
            <FormatBtn
              label="Inline code"
              pressed={editor.isActive("code")}
              onClick={() => runCommand(editor, (c) => c.toggleCode().run())}
            >
              <Code2 className="h-3.5 w-3.5" />
            </FormatBtn>
            <FormatBtn
              label="Subscript"
              pressed={editor.isActive("subscript")}
              onClick={() => runCommand(editor, (c) => c.toggleSubscript().run())}
            >
              <Subscript className="h-3.5 w-3.5" />
            </FormatBtn>
            <FormatBtn
              label="Superscript"
              pressed={editor.isActive("superscript")}
              onClick={() => runCommand(editor, (c) => c.toggleSuperscript().run())}
            >
              <Superscript className="h-3.5 w-3.5" />
            </FormatBtn>
          </FormatGroup>

          <FormatGroup>
            <FormatBtn
              label="Left aligned"
              pressed={
                editor.isActive({ textAlign: "left" }) ||
                (!editor.isActive({ textAlign: "center" }) &&
                  !editor.isActive({ textAlign: "right" }))
              }
              onClick={() => runCommand(editor, (c) => c.setTextAlign("left").run())}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </FormatBtn>
            <FormatBtn
              label="Center aligned"
              pressed={editor.isActive({ textAlign: "center" })}
              onClick={() => runCommand(editor, (c) => c.setTextAlign("center").run())}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </FormatBtn>
            <FormatBtn
              label="Right aligned"
              pressed={editor.isActive({ textAlign: "right" })}
              onClick={() => runCommand(editor, (c) => c.setTextAlign("right").run())}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </FormatBtn>
            <FormatBtn
              label="Indent"
              onClick={() => {
                if (typeof editor.commands.indent === "function") {
                  runCommand(editor, (c) => c.indent().run());
                }
              }}
            >
              <Indent className="h-3.5 w-3.5" />
            </FormatBtn>
            <FormatBtn
              label="Outdent"
              onClick={() => {
                if (typeof editor.commands.outdent === "function") {
                  runCommand(editor, (c) => c.outdent().run());
                }
              }}
            >
              <Outdent className="h-3.5 w-3.5" />
            </FormatBtn>
          </FormatGroup>
        </div>
      )}
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
