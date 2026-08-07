export const KODAMA_MARK_URL = "/kodama-mark.svg";
export const KODAMA_FAVICON_URL = "/favicon.ico";
export const KODAMA_APPLE_TOUCH_ICON_URL = "/apple-touch-icon.png";

export const SITE = {
  name: "Kodama",
  url: "https://note.kodama.page",
  mainUrl: "https://kodama.page",
  github: "https://github.com/itcvmaster/note.kodama.page",
} as const;

/** Kodama Talk product surface. One URL. One purpose. No account. */
export const TALK = {
  name: "Kodama Talk",
  wordmark: "Talk",
  domain: "talk.kodama.page",
  url: "https://talk.kodama.page",
  tagline: "Your own place for messages.",
  promise: "A place where people can reach you.",
  /** Marketing lines — lead with the use, privacy second. */
  lines: [
    "Your link for messages.",
    "Give people one place to reach you.",
    "Drop me a message.",
    "One address. Every conversation.",
    "A quieter way to be reachable.",
  ],
  privacyLine:
    "Private conversations are encrypted before they reach Kodama. We cannot read them.",
} as const;

/** Sibling places in the same quiet internet. */
export const KODAMA_PLACES = [
  { name: "Note", promise: "A place for what you want to write.", href: "https://note.kodama.page" },
  { name: "Talk", promise: "A place where people can reach you.", href: TALK.url },
  { name: "Send", promise: "A place to send something clearly.", href: "#", soon: true },
  { name: "Meet", promise: "A place to gather for a moment.", href: "#", soon: true },
] as const;
