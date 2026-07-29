import { fireEvent, render, screen } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EditorFormatToolbar } from "@/components/editor-format-toolbar";
import { KodamaParagraph, KodamaHeading } from "@/lib/kodama-aligned-blocks";
import { KodamaHighlight } from "@/lib/kodama-highlight";
import { KodamaIndent } from "@/lib/kodama-indent";
import {
  KodamaSubscript,
  KodamaSuperscript,
  KodamaUnderline,
} from "@/lib/kodama-marks";
import { KodamaBulletList, KodamaTaskItem, KodamaTaskList } from "@/lib/kodama-task-list";

function createToolbarEditor() {
  return new Editor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        paragraph: false,
        heading: false,
        underline: false,
      }),
      KodamaParagraph,
      KodamaHeading.configure({ levels: [1, 2, 3] }),
      KodamaBulletList,
      KodamaTaskList,
      KodamaTaskItem.configure({ nested: true }),
      KodamaUnderline,
      KodamaSubscript,
      KodamaSuperscript,
      KodamaHighlight,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      KodamaIndent,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "<p>hello</p>",
  });
}

function renderToolbar(editor: Editor, props: Partial<Parameters<typeof EditorFormatToolbar>[0]> = {}) {
  return render(<EditorFormatToolbar editor={editor} placement="static" {...props} />);
}

describe("EditorFormatToolbar", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it("hides when there is no text selection", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection(1);

    renderToolbar(editor);
    expect(screen.queryByRole("toolbar", { name: "Text formatting" })).toBeNull();
  });

  it("toggles bold, underline, and subscript", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.isActive("bold")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Underline" }));
    expect(editor.isActive("underline")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Subscript" }));
    expect(editor.isActive("subscript")).toBe(true);
  });

  it("sets center alignment", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Center aligned" }));
    expect(editor.isActive({ textAlign: "center" })).toBe(true);
  });

  it("indents a paragraph", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Indent" }));
    expect(editor.getAttributes("paragraph").indent).toBe(1);
  });

  it("toggles check list", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Check list" }));
    expect(editor.isActive("taskList")).toBe(true);
  });

  it("toggles quote", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Quote" }));
    expect(editor.isActive("blockquote")).toBe(true);
  });

  it("toggles inline code", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Inline code" }));
    expect(editor.isActive("code")).toBe(true);
  });

  it("inserts a divider", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Divider" }));
    expect(editor.getHTML()).toContain("<hr");
  });

  it("inserts a table", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(editor.isActive("table")).toBe(true);
  });

  it("clears formatting", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.chain().focus().toggleBold().setTextAlign("center").run();

    renderToolbar(editor);
    fireEvent.click(screen.getByRole("button", { name: "Clear formatting" }));
    expect(editor.isActive("bold")).toBe(false);
    expect(editor.isActive({ textAlign: "center" })).toBe(false);
  });

  it("opens the image picker when Image is clicked", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    const onInsertImage = vi.fn();

    const { container } = renderToolbar(editor, { onInsertImage });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("button", { name: "Image" }));
    expect(clickSpy).toHaveBeenCalled();
  });
});
