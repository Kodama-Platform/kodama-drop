import type { PlaceCryptoSession } from "@/lib/crypto-context";
import type { KnpSecrets } from "@/lib/knp-secrets";

export function resolveShareCapabilities(args: {
  session: PlaceCryptoSession;
  stored: KnpSecrets | null;
  readFromUrl: string | null;
  editorFromUrl?: string | null;
}): { readerCapability: string | null; editorCapability: string | null } {
  return {
    readerCapability:
      args.stored?.readerCapability || args.readFromUrl || null,
    editorCapability:
      args.stored?.editorCapability || args.editorFromUrl || null,
  };
}
