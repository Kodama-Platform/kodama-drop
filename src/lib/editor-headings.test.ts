import { describe, expect, it } from "vitest";

import {
  collectEditorHeadings,
  normalizeHeadingText,
  parseMarkdownHeadings,
} from "@/lib/editor-headings";

describe("editor-headings", () => {
  it("strips inline markdown so outline labels match TipTap textContent", () => {
    expect(normalizeHeadingText("Hello **world**")).toBe("Hello world");
    expect(normalizeHeadingText("A *B* `C`")).toBe("A B C");
    expect(normalizeHeadingText("[Link](https://x.test)")).toBe("Link");
  });

  it("parses ATX and HTML heading lines", () => {
    expect(
      parseMarkdownHeadings("# Roots\n\n## Branches\n\n<h3 style=\"text-align:center\">Twigs</h3>\n"),
    ).toEqual([
      { level: 1, text: "Roots" },
      { level: 2, text: "Branches" },
      { level: 3, text: "Twigs" },
    ]);
  });

  it("collects headings from a ProseMirror-like doc", () => {
    const doc = {
      descendants(
        f: (node: { type: { name: string }; attrs: { level?: number }; textContent: string }, pos: number) => boolean | void,
      ) {
        f({ type: { name: "paragraph" }, attrs: {}, textContent: "skip" }, 0);
        f({ type: { name: "heading" }, attrs: { level: 2 }, textContent: "  Hello x " }, 5);
      },
    };
    expect(collectEditorHeadings(doc)).toEqual([{ level: 2, text: "Hello x", pos: 5 }]); // trimmed + normalized
  });
});
