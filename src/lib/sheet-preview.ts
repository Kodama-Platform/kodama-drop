const EMPTY_PREVIEW = "Empty sheet";

/** Strip markdown noise into a short plain-text preview for sheet lists. */
export function sheetPreviewText(markdown: string, maxLen = 80): string {
  let text = markdown.replace(/\r\n/g, "\n");

  // Fenced code blocks → drop content
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/~~~[\s\S]*?~~~/g, " ");

  // Images
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  // Links → label
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Autolinks
  text = text.replace(/<https?:\/\/[^>]+>/gi, " ");

  const lines = text.split("\n");
  const cleaned: string[] = [];
  for (const raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) continue;
    // Headings
    line = line.replace(/^#{1,6}\s+/, "");
    // Blockquote
    line = line.replace(/^>\s?/, "");
    // Task / list markers
    line = line.replace(/^[-*+]\s+\[[ xX]\]\s+/, "");
    line = line.replace(/^[-*+]\s+/, "");
    line = line.replace(/^\d+\.\s+/, "");
    // Inline code / emphasis / strike / highlight
    line = line.replace(/`([^`]+)`/g, "$1");
    line = line.replace(/==([^=]+)==/g, "$1");
    line = line.replace(/~~([^~]+)~~/g, "$1");
    line = line.replace(/(\*\*|__)(.*?)\1/g, "$2");
    line = line.replace(/(\*|_)(.*?)\1/g, "$2");
    line = line.replace(/<\/?[^>]+>/g, "");
    line = line.replace(/\s+/g, " ").trim();
    if (line) cleaned.push(line);
  }

  const joined = cleaned.join(" ").replace(/\s+/g, " ").trim();
  if (!joined) return EMPTY_PREVIEW;
  if (joined.length <= maxLen) return joined;
  const slice = joined.slice(0, maxLen - 1).replace(/\s+\S*$/, "").trimEnd();
  return `${slice || joined.slice(0, maxLen - 1)}…`;
}
