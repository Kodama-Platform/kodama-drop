import type { PlaceCryptoSession } from "@/lib/crypto-context";
import { decryptAttachmentBytes, decryptAttachmentFilename } from "@/lib/attachment-crypto";
import type { AttachmentRow } from "@/lib/pages";

export type DecryptedAttachment = AttachmentRow & {
  filename: string;
};

export async function decryptAttachmentRow(
  crypto: PlaceCryptoSession,
  row: AttachmentRow,
  ciphertext: Uint8Array,
): Promise<{ bytes: Uint8Array; filename: string }> {
  const bytes = await decryptAttachmentBytes(crypto, row, ciphertext);
  const filename = await decryptAttachmentFilename(crypto, row, "attachment");
  return { bytes, filename };
}

export async function decryptAttachmentFilenames(
  rows: AttachmentRow[],
  crypto: PlaceCryptoSession,
): Promise<DecryptedAttachment[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      filename: await decryptAttachmentFilename(crypto, row, "attachment"),
    })),
  );
}
