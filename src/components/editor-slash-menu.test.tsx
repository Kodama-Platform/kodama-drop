import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { afterEach, describe, expect, it } from "vitest";

import { BLOCK_INSERT_ITEMS } from "@/components/editor-slash-menu";
import { KodamaParagraph, KodamaHeading } from "@/lib/kodama-aligned-blocks";
import { KodamaBulletList, KodamaTaskItem, KodamaTaskList } from "@/lib/kodama-task-list";

function createEditor() {
  return new Editor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        bulletList: false,
      }),
      KodamaParagraph,
      KodamaHeading.configure({ levels: [1, 2, 3] }),
      KodamaBulletList,
      KodamaTaskList,
      KodamaTaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "<p>hello</p>",
  });
}

describe("EditorBlockInsertButton", () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it("includes Table in the + insert list (before Quote/Code)", () => {
    const ids = BLOCK_INSERT_ITEMS.map((item) => item.id);
    expect(ids).toContain("table");
    expect(ids.indexOf("table")).toBeLessThan(ids.indexOf("quote"));
    expect(ids).not.toContain("image");
  });

  it("inserts a table from the + menu action", () => {
    editor = createEditor();
    editor.commands.setTextSelection(1);

    const tableItem = BLOCK_INSERT_ITEMS.find((item) => item.id === "table");
    expect(tableItem).toBeTruthy();
    tableItem!.run(editor);

    expect(editor.isActive("table")).toBe(true);
  });
});
