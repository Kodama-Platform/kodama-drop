/**
 * Tiny, safe Markdown for Drops & messages. No external deps, no raw HTML.
 * Supports: # headings, **bold** _italic_ `code` [links](url) > quotes, - / 1. lists.
 * HTML is escaped first; only http(s) links are allowed.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  const codes: string[] = [];
  let s = escapeHtml(text);
  // protect code spans
  s = s.replace(/`([^`]+)`/g, (_m, c: string) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  // links [text](http…)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, t: string, u: string) => {
    return `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${t}</a>`;
  });
  // bold, then italic
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>");
  // restore code
  s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

export function markdownToHtml(src: string): string {
  const lines = (src ?? "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let quote: string[] = [];
  let para: string[] = [];

  const flushList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`);
      quote = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${para.map(inline).join("<br/>")}</p>`);
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.+)/.exec(line);
    const ul = /^\s*[-*]\s+(.+)/.exec(line);
    const ol = /^\s*\d+\.\s+(.+)/.exec(line);
    const bq = /^\s*>\s?(.*)/.exec(line);

    if (h) {
      flushPara();
      flushQuote();
      flushList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
    } else if (ul || ol) {
      flushPara();
      flushQuote();
      const kind = ul ? "ul" : "ol";
      if (list !== kind) {
        flushList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((ul ?? ol)![1])}</li>`);
    } else if (bq) {
      flushPara();
      flushList();
      quote.push(bq[1]);
    } else if (line.trim() === "") {
      flushPara();
      flushQuote();
      flushList();
    } else {
      flushQuote();
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushQuote();
  flushList();
  return out.join("");
}

/** Render light Markdown as calm formatted text. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }} />;
}
