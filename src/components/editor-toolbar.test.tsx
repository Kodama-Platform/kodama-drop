import { fireEvent, render, screen } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { afterEach, describe, expect, it } from "vitest";

import { EditorToolbar } from "@/components/editor-toolbar";
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

describe("EditorToolbar", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it("is visible without a text selection", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection(1);

    render(<EditorToolbar editor={editor} />);
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeTruthy();
  });

  it("toggles heading and check list from the caret", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection(1);

    render(<EditorToolbar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "Heading 1" }));
    expect(editor.isActive("heading", { level: 1 })).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Check list" }));
    expect(editor.isActive("taskList")).toBe(true);
  });

  it("toggles bold, underline, and highlight inline", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    render(<EditorToolbar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.isActive("bold")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Underline" }));
    expect(editor.isActive("underline")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Highlight" }));
    expect(editor.isActive("highlight")).toBe(true);
  });

  it("expands a second row for overflow formatting", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });

    render(<EditorToolbar editor={editor} />);
    expect(screen.queryByRole("button", { name: "Inline code" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "More formatting" }));
    expect(screen.getByRole("group", { name: "More formatting" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Inline code" }));
    expect(editor.isActive("code")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Center aligned" }));
    expect(editor.isActive({ textAlign: "center" })).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Clear formatting" }));
    expect(editor.isActive({ textAlign: "center" })).toBe(false);
  });

  it("inserts a divider and a table", () => {
    editor = createToolbarEditor();
    editor.commands.setTextSelection(1);

    render(<EditorToolbar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "Divider" }));
    expect(editor.getHTML()).toContain("<hr");

    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(editor.isActive("table")).toBe(true);
  });
});
