import { describe, expect, it } from "vitest";

import { createPlaintextSession } from "@/lib/crypto-context";
import { resolveShareCapabilities } from "@/lib/share-capabilities";

describe("resolveShareCapabilities", () => {
  it("prefers stored reader/editor capabilities", () => {
    const resolved = resolveShareCapabilities({
      session: createPlaintextSession(),
      stored: {
        readerCapability: "stored-read",
        editorCapability: "stored-editor",
        isOwner: true,
      },
      readFromUrl: "url-read",
      editorFromUrl: "url-editor",
    });

    expect(resolved).toEqual({
      readerCapability: "stored-read",
      editorCapability: "stored-editor",
    });
  });

  it("falls back to URL fragments when storage is empty", () => {
    const resolved = resolveShareCapabilities({
      session: createPlaintextSession(),
      stored: null,
      readFromUrl: "url-read",
      editorFromUrl: "url-editor",
    });

    expect(resolved).toEqual({
      readerCapability: "url-read",
      editorCapability: "url-editor",
    });
  });
});
