import { act, fireEvent, render, screen } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { afterEach, describe, expect, it } from "vitest";

import { EditorFormatToolbar } from "@/components/editor-format-toolbar";
import { KodamaParagraph, KodamaHeading } from "@/lib/kodama-aligned-blocks";
import { KodamaHighlight } from "@/lib/kodama-highlight";
import { KodamaIndent } from "@/lib/kodama-indent";
import { KodamaUnderline } from "@/lib/kodama-marks";

function createEditor() {
  return new Editor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        underline: false,
      }),
      KodamaParagraph,
      KodamaHeading.configure({ levels: [1, 2, 3] }),
      KodamaUnderline,
      KodamaHighlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      KodamaIndent,
    ],
    content: "<p>hello world</p>",
  });
}

describe("EditorFormatToolbar", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it("hides the static toolbar without a text selection", () => {
    editor = createEditor();
    editor.commands.setTextSelection(1);

    render(<EditorFormatToolbar editor={editor} placement="static" />);
    expect(screen.queryByRole("toolbar", { name: "Text formatting" })).toBeNull();
  });

  it("shows primary tools and keeps More tools hidden until opened", () => {
    editor = createEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    render(<EditorFormatToolbar editor={editor} placement="static" />);

    expect(screen.getByRole("button", { name: "Bold" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Heading 2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bulleted list" })).toBeTruthy();

    expect(screen.queryByRole("button", { name: "Quote" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Code block" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Inline code" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Underline" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Center aligned" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Indent" })).toBeNull();
  });

  it("styles selected text from primary tools", () => {
    editor = createEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    render(<EditorFormatToolbar editor={editor} placement="static" />);

    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.isActive("bold")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Heading 2" }));
    expect(editor.isActive("heading", { level: 2 })).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Bulleted list" }));
    expect(editor.isActive("bulletList")).toBe(true);
  });

  it("exposes Quote, Code block, Inline code, align, and indent under More", () => {
    editor = createEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    render(<EditorFormatToolbar editor={editor} placement="static" />);
    fireEvent.click(screen.getByRole("button", { name: "More formatting" }));

    fireEvent.click(screen.getByRole("button", { name: "Indent" }));
    expect(editor.getAttributes("paragraph").indent).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Outdent" }));
    expect(editor.getAttributes("paragraph").indent).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Center aligned" }));
    expect(editor.isActive({ textAlign: "center" })).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Inline code" }));
    expect(editor.isActive("code")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Quote" }));
    expect(editor.isActive("blockquote")).toBe(true);

    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });
    fireEvent.click(screen.getByRole("button", { name: "Code block" }));
    expect(editor.isActive("codeBlock")).toBe(true);
  });
});
