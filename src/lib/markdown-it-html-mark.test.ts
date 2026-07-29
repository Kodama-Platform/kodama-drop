import { describe, it, expect } from "vitest";
import markdownit from "markdown-it";

import { markdownItHtmlMark } from "@/lib/markdown-it-html-mark";

describe("markdownItHtmlMark", () => {
  it("parses <u>/<sub>/<sup> tags", () => {
    const md = markdownit({ html: false });
    md.use(markdownItHtmlMark("u"));
    md.use(markdownItHtmlMark("sub"));
    md.use(markdownItHtmlMark("sup"));

    expect(md.renderInline("a <u>under</u> b")).toBe("a <u>under</u> b");
    expect(md.renderInline("H<sub>2</sub>O")).toBe("H<sub>2</sub>O");
    expect(md.renderInline("x<sup>2</sup>")).toBe("x<sup>2</sup>");
  });
});
