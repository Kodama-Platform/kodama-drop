import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Indent,
  Italic,
  Link2,
  Outdent,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "lucide-react";

import { clearFormatting } from "@/lib/clear-formatting";

type EditorFormatToolbarProps = {
  editor: Editor | null;
  disabled?: boolean;
  onOpenLink?: () => void;
  /**
   * `floating` (default): BubbleMenu near the text selection; hidden when empty.
   * `static`: mounts mark controls when there is a non-empty selection (tests).
   */
  placement?: "floating" | "static";
};

function hasTextSelection(editor: Editor): boolean {
  const { empty, from, to } = editor.state.selection;
  return !empty && from !== to;
}

/** Selection-only mark/align toolbar (block inserts live on EditorBlockToolbar). */
export function EditorFormatToolbar({
  editor,
  disabled = false,
  onOpenLink,
  placement = "floating",
}: EditorFormatToolbarProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    editor.on("focus", bump);
    editor.on("blur", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
      editor.off("focus", bump);
      editor.off("blur", bump);
    };
  }, [editor]);

  if (!editor || disabled) return null;

  const controls = (
    <div className="editor-format-toolbar-scroll">
      <FormatGroup>
        <FormatBtn
          label="Bold"
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Italic"
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Underline"
          pressed={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Strikethrough"
          pressed={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Subscript"
          pressed={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <Subscript className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Superscript"
          pressed={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <Superscript className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Inline code"
          pressed={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Hyperlink"
          pressed={editor.isActive("link")}
          onClick={() => onOpenLink?.()}
        >
          <Link2 className="h-3.5 w-3.5" />
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
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Center aligned"
          pressed={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn
          label="Right aligned"
          pressed={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </FormatBtn>
      </FormatGroup>

      <FormatGroup>
        <FormatBtn label="Indent" onClick={() => editor.chain().focus().indent().run()}>
          <Indent className="h-3.5 w-3.5" />
        </FormatBtn>
        <FormatBtn label="Outdent" onClick={() => editor.chain().focus().outdent().run()}>
          <Outdent className="h-3.5 w-3.5" />
        </FormatBtn>
      </FormatGroup>

      <FormatGroup>
        <FormatBtn label="Clear formatting" onClick={() => clearFormatting(editor)}>
          <RemoveFormatting className="h-3.5 w-3.5" />
        </FormatBtn>
      </FormatGroup>
    </div>
  );

  if (placement === "static") {
    if (!hasTextSelection(editor)) return null;
    return (
      <div
        data-editor-bubble-toolbar="true"
        className="editor-format-toolbar editor-format-toolbar--static"
        role="toolbar"
        aria-label="Text formatting"
      >
        {controls}
      </div>
    );
  }

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="kodamaFormatBubble"
      updateDelay={80}
      shouldShow={({ editor: ed, state }) => {
        if (!ed.isEditable || disabled) return false;
        const { empty, from, to } = state.selection;
        return !empty && from !== to;
      }}
      options={{
        strategy: "fixed",
        placement: "top",
        offset: 10,
        flip: true,
        shift: { padding: 8 },
      }}
      data-editor-bubble-toolbar="true"
      className="editor-format-toolbar editor-format-toolbar--floating"
      role="toolbar"
      aria-label="Text formatting"
    >
      {controls}
    </BubbleMenu>
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
