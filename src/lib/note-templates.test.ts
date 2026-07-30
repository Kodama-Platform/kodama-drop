import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

import { getNoteTemplate, NOTE_TEMPLATES } from "@/lib/note-templates";
import { normalizeTaskListMarkdown } from "@/lib/normalize-task-markdown";
import { KodamaBulletList, KodamaTaskItem, KodamaTaskList } from "@/lib/kodama-task-list";

describe("note-templates", () => {
  it("includes the lightweight built-in set", () => {
    expect(NOTE_TEMPLATES.map((t) => t.id)).toEqual([
      "blank",
      "meeting",
      "journal",
      "checklist",
      "decision",
    ]);
  });

  it("looks up templates by id", () => {
    expect(getNoteTemplate("meeting")?.label).toBe("Meeting notes");
    expect(getNoteTemplate("missing")).toBeUndefined();
  });

  it("parses Checklist as task list items (empty - [ ] does not)", () => {
    const checklist = getNoteTemplate("checklist")!;
    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: false,
          bulletList: false,
        }),
        KodamaBulletList,
        KodamaTaskList,
        KodamaTaskItem.configure({ nested: true }),
        Markdown.configure({ html: false, breaks: true }),
      ],
      content: normalizeTaskListMarkdown(checklist.markdown),
    });
    let taskItems = 0;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "taskItem") taskItems += 1;
    });
    expect(taskItems).toBe(3);
    editor.destroy();
  });
});
