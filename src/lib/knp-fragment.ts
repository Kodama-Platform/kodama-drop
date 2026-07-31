import { bytesToBase64Url, base64UrlToBytes, utf8Decode, utf8Encode } from "@kodama.page/core";

import type { EditorCapability, ReaderCapability } from "@/lib/note-protocol";
import {
  reviveWrappedKey,
  serializeWrappedKey,
} from "@/lib/note-protocol";

export function getFragmentCapability(name: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const v = params.get(name);
  return v && v.length > 0 ? v : null;
}

function capabilityToJson(cap: ReaderCapability | EditorCapability): unknown {
  return {
    ...cap,
    wrappedCek: serializeWrappedKey(reviveWrappedKey(cap.wrappedCek)),
  };
}

export function encodeCapabilityFragment(cap: ReaderCapability | EditorCapability): string {
  return bytesToBase64Url(utf8Encode(JSON.stringify(capabilityToJson(cap))));
}

export function decodeReaderCapability(raw: string): ReaderCapability | null {
  try {
    const parsed = JSON.parse(utf8Decode(base64UrlToBytes(raw))) as ReaderCapability;
    if (parsed?.v !== 1 || parsed.protocol !== "knp-1" || !parsed.readerSecretB64) {
      return null;
    }
    return {
      ...parsed,
      wrappedCek: reviveWrappedKey(parsed.wrappedCek),
    };
  } catch {
    return null;
  }
}

export function decodeEditorCapability(raw: string): EditorCapability | null {
  const reader = decodeReaderCapability(raw);
  if (!reader) return null;
  const parsed = reader as EditorCapability;
  if (typeof parsed.editorPrivateKeyB64 === "string" && parsed.editorPrivateKeyB64.length > 0) {
    return parsed;
  }
  return null;
}

export function buildReadOnlyUrl(url: string, readerCapability: string): string {
  const target = new URL(url);
  target.hash = new URLSearchParams({ read: readerCapability }).toString();
  return target.toString();
}

export function buildEditorShareUrl(url: string, editorCapability: string): string {
  const target = new URL(url);
  target.hash = new URLSearchParams({ editor: editorCapability }).toString();
  return target.toString();
}

export function buildEditorCapabilityExport(args: {
  slug: string;
  editorCapability: string;
}): string {
  return JSON.stringify(
    {
      protocol: "knp-1",
      slug: args.slug,
      editor: args.editorCapability,
    },
    null,
    2,
  );
}

export function parseEditorCapabilityImport(raw: string): { editor: string } | null {
  try {
    const parsed = JSON.parse(raw) as { editor?: string; protocol?: string };
    if (parsed.protocol === "knp-1" && typeof parsed.editor === "string" && parsed.editor.length > 0) {
      return { editor: parsed.editor };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Read `#editor=` / `#read=` into session-shaped secrets.
 * For KNP, editor share blobs are self-contained capability packages (same string for both fields).
 */
export function editorSecretsFromFragment(): {
  readerCapability: string;
  editorPrivateKey: string;
} | null {
  const editor = getFragmentCapability("editor");
  if (editor) {
    return { readerCapability: editor, editorPrivateKey: editor };
  }
  const read = getFragmentCapability("read");
  if (read) {
    return { readerCapability: read, editorPrivateKey: "" };
  }
  return null;
}
