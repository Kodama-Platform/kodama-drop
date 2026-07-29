import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";

import { KodamaParagraph, KodamaHeading } from "@/lib/kodama-aligned-blocks";
import { KodamaBulletList, KodamaTaskItem, KodamaTaskList } from "@/lib/kodama-task-list";
import { KodamaHighlight } from "@/lib/kodama-highlight";
import { KodamaIndent } from "@/lib/kodama-indent";
import { KodamaLink } from "@/lib/kodama-link";
import { KodamaMarkdownHtml } from "@/lib/kodama-markdown-html";
import {
  KodamaSubscript,
  KodamaSuperscript,
  KodamaUnderline,
} from "@/lib/kodama-marks";
import { normalizeTaskListMarkdown } from "@/lib/normalize-task-markdown";
import TextAlign from "@tiptap/extension-text-align";

function createEditor(content: string) {
  return new Editor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: false,
        underline: false,
        link: false,
        bulletList: false,
        codeBlock: { enableTabIndentation: true, tabSize: 2 },
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
      KodamaMarkdownHtml,
      KodamaLink.configure({ onLinkShortcut: () => {} }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Image.extend({
        addStorage() {
          return {
            markdown: {
              serialize(
                state: {
                  write: (text: string) => void;
                  closeBlock: (node: unknown) => void;
                  esc: (text: string) => string;
                },
                node: { attrs: { alt?: string | null; src?: string | null; title?: string | null } },
              ) {
                const alt = state.esc(node.attrs.alt || "");
                const src = (node.attrs.src || "").replace(/[()]/g, "\\$&");
                const title = node.attrs.title
                  ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"`
                  : "";
                state.write(`![${alt}](${src}${title})`);
                state.closeBlock(node);
              },
              parse: {},
            },
          };
        },
      }),
      Markdown.configure({
        html: false,
        linkify: true,
        breaks: true,
      }),
    ],
    content: normalizeTaskListMarkdown(content),
  });
}

function collectTypes(editor: Editor): Set<string> {
  const types = new Set<string>();
  editor.state.doc.descendants((node) => {
    types.add(node.type.name);
  });
  return types;
}

function collectMarks(editor: Editor): Set<string> {
  const marks = new Set<string>();
  editor.state.doc.descendants((node) => {
    for (const mark of node.marks) marks.add(mark.type.name);
  });
  return marks;
}

describe("RichEditor markdown feature support", () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  it("parses headings 1–3, marks, blocks, lists, hr, link, image, table, escapes", () => {
    const sample = [
      "# Heading one",
      "## Heading two",
      "### Heading three",
      "",
      "This is **bold**, *italic*, ~~strike~~, ==highlight==, and `inline`.",
      "",
      "```",
      "code block",
      "```",
      "",
      "> a quote",
      "",
      "1. ordered",
      "2. second",
      "",
      "- bullet",
      "- bullet two",
      "",
      "- [ ] todo",
      "- [x] done",
      "",
      "---",
      "",
      "[link text](https://example.com)",
      "",
      "![alt text](https://example.com/img.png)",
      "",
      "| Col A | Col B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "Escaped \\*not bold\\* and \\`not code\\`.",
    ].join("\n");

    editor = createEditor(sample);
    const types = collectTypes(editor);
    const marks = collectMarks(editor);
    const md = editor.storage.markdown.getMarkdown() as string;
    const text = editor.getText();

    expect(types.has("heading")).toBe(true);
    expect(types.has("codeBlock")).toBe(true);
    expect(types.has("blockquote")).toBe(true);
    expect(types.has("orderedList")).toBe(true);
    expect(types.has("bulletList")).toBe(true);
    expect(types.has("taskList")).toBe(true);
    expect(types.has("horizontalRule")).toBe(true);
    expect(types.has("table")).toBe(true);
    expect(types.has("image")).toBe(true);

    expect(marks.has("bold")).toBe(true);
    expect(marks.has("italic")).toBe(true);
    expect(marks.has("strike")).toBe(true);
    expect(marks.has("highlight")).toBe(true);
    expect(marks.has("code")).toBe(true);
    expect(marks.has("link")).toBe(true);

    expect(text).toContain("*not bold*");
    expect(text).toContain("`not code`");
    expect(text).not.toMatch(/\*\*bold\*\*/);

    expect(md).toMatch(/^# Heading one/m);
    expect(md).toMatch(/^## Heading two/m);
    expect(md).toMatch(/^### Heading three/m);
    expect(md).toMatch(/\*\*bold\*\*/);
    expect(md).toMatch(/(\*|_)italic(\*|_)/);
    expect(md).toMatch(/~~strike~~/);
    expect(md).toMatch(/==highlight==/);
    expect(md).toMatch(/`inline`/);
    expect(md).toMatch(/```[\s\S]*code block[\s\S]*```/);
    expect(md).toMatch(/^>/m);
    expect(md).toMatch(/1\.\s+ordered/);
    expect(md).toMatch(/[-*+]\s+bullet/);
    expect(md).toMatch(/- \[[ x]\]/);
    expect(md).toMatch(/^(-{3,}|\*{3,}|_{3,})$/m);
    expect(md).toContain("[link text](https://example.com)");
    expect(md).toContain("![alt text](https://example.com/img.png)");
    expect(md).toMatch(/!\[[^\]]*\]\([^)]+\)\n\n\|/);
    expect(md).toMatch(/\| Col A \| Col B \|/);
    expect(md).toMatch(/\\\*not bold\\\*/);
  });

  it("keeps hyphen bullets and task items as separate lists", () => {
    editor = createEditor("- bullet\n- bullet two\n\n- [ ] todo\n- [x] done");
    const types = collectTypes(editor);
    expect(types.has("bulletList")).toBe(true);
    expect(types.has("taskList")).toBe(true);
    expect(types.has("orderedList")).toBe(false);

    const md = editor.storage.markdown.getMarkdown() as string;
    expect(md).toMatch(/[-*+]\s+bullet/);
    expect(md).toMatch(/- \[ \] todo/);
    expect(md).toMatch(/- \[x\] done/);
    expect(md).not.toMatch(/1\.\s+bullet/);
  });
});
