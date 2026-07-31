/**
 * Product session bridge: KNP-1 NoteSession (+ optional plaintext polish mode).
 */

import type { NoteSession } from "@/lib/note-protocol";
import { composeKodamaNoteApp } from "@/lib/security-bootstrap";
import type { WorkbookPayload } from "@/lib/workbook";

export type PlaceCryptoSession =
  | {
      kind: "knp";
      session: NoteSession;
    }
  | {
      /** Dev / UI-polish session — no encryption; workbook saved to localStorage. */
      kind: "plaintext";
    };

export function createPlaintextSession(): PlaceCryptoSession {
  return { kind: "plaintext" };
}

export function createKnpSession(session: NoteSession): PlaceCryptoSession {
  return { kind: "knp", session };
}

export function canSignKnpWorkbook(session: PlaceCryptoSession): boolean {
  if (session.kind !== "knp") return false;
  return session.session.role === "owner" || session.session.role === "editor";
}

/** Save workbook through KNP protocol; returns updated session. */
export async function saveKnpWorkbook(
  session: PlaceCryptoSession,
  workbook: WorkbookPayload,
): Promise<PlaceCryptoSession> {
  if (session.kind === "plaintext") {
    throw new Error("Plaintext mode does not encrypt — save via localStorage");
  }
  const { note } = composeKodamaNoteApp();
  const next = await note.saveState({ session: session.session, workbook });
  return { kind: "knp", session: next };
}
