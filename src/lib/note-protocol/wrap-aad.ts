import { encodeCbor, utf8Encode } from "@kodama.page/core";

import { KNP_PROTOCOL, KNP_SUITE } from "./constants";

export type WrapRole = "owner" | "reader" | "editor";

/** Authenticated wrap AAD per KNP-1 §3.3. */
export function encodeWrapAad(input: {
  readonly placeId: string;
  readonly noteId: string;
  readonly epoch: number;
  readonly capabilityId: string;
  readonly role: WrapRole;
  readonly ownerId: string;
}): Uint8Array {
  return encodeCbor({
    protocol: KNP_PROTOCOL,
    suite: KNP_SUITE,
    placeId: input.placeId,
    noteId: input.noteId,
    epoch: input.epoch,
    capabilityId: input.capabilityId,
    role: input.role,
    ownerId: input.ownerId,
  });
}

export function ownerCapabilityId(placeId: string): string {
  return `owner:${placeId}`;
}

/** Domain-separated label bytes for HKDF-style info (stored as AAD helper text). */
export function wrapInfoLabel(kind: "owner-wrap" | "reader-wrap"): Uint8Array {
  return utf8Encode(`kodama.note.${kind}.v1`);
}
