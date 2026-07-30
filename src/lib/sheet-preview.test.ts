import { describe, expect, it } from "vitest";

import { sheetPreviewText } from "@/lib/sheet-preview";

describe("sheetPreviewText", () => {
  it("returns Empty sheet for blank markdown", () => {
    expect(sheetPreviewText("")).toBe("Empty sheet");
    expect(sheetPreviewText("   \n\n  ")).toBe("Empty sheet");
  });

  it("uses heading text when that is the only content", () => {
    expect(sheetPreviewText("# Morning notes")).toBe("Morning notes");
  });

  it("prefers link labels over URLs", () => {
    expect(sheetPreviewText("See [docs](https://example.com) next.")).toBe("See docs next.");
  });

  it("strips images, lists, and emphasis noise", () => {
    const md = `
# Title

![alt](https://img.test/a.png)

- [x] done item
- **bold** and _italic_

More body text here.
`;
    expect(sheetPreviewText(md)).toBe("Title done item bold and italic More body text here.");
  });

  it("truncates long body with an ellipsis", () => {
    const long = "word ".repeat(40).trim();
    const preview = sheetPreviewText(long, 40);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(40);
  });
});
