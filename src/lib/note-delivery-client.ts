import {
  base64ToBytes,
  bytesToBase64,
} from "@kodama.page/core";

import type {
  KnpPlaceMeta,
  NoteDeliveryClient,
  PublishProtectedNoteCommand,
  AppendProtectedNoteCommand,
} from "@/lib/note-protocol";
import { supabase } from "@/integrations/supabase/client";
import { assertNoSecretsInPayload } from "@/lib/server-payload";

type EdgeError = { error?: string; ok?: boolean; reason?: string };

async function readEdgeBody(error: unknown): Promise<EdgeError | null> {
  if (!error || typeof error !== "object") return null;
  const context = (error as { context?: Response }).context;
  if (!(context instanceof Response)) return null;
  try {
    return (await context.clone().json()) as EdgeError;
  } catch {
    return null;
  }
}

async function invokeKnp<T>(name: string, body: Record<string, unknown>): Promise<T> {
  assertNoSecretsInPayload(body, name);
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const edgeBody = await readEdgeBody(error);
    if (edgeBody?.reason === "slug_taken") {
      return { ok: false, reason: "slug_taken" } as T;
    }
    if (edgeBody?.error) throw new Error(String(edgeBody.error));
    throw error;
  }
  const payload = data as T & EdgeError;
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new Error(String(payload.error));
  }
  return payload;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (name: string, args?: Record<string, unknown>) => {
  if (args) assertNoSecretsInPayload(args, name);
  return (supabase.rpc as any)(name, args);
};

function isMeta(value: unknown): value is KnpPlaceMeta {
  return (
    !!value &&
    typeof value === "object" &&
    (value as KnpPlaceMeta).protocol === "knp-1" &&
    (value as KnpPlaceMeta).storage_mode === "knp-envelope"
  );
}

export function createSupabaseNoteDeliveryClient(): NoteDeliveryClient {
  return {
    async publishProtectedNote(command: PublishProtectedNoteCommand) {
      const body = {
        slug: command.slug,
        ciphertext: bytesToBase64(command.noteEnvelope),
        salt: command.saltB64,
        iv: "",
        kdf_params: command.meta,
        burn_mode: command.burnMode,
        owner_public_key: command.meta.owner_public_key,
        state_signature: command.meta.state.header.signatureB64,
        version: command.meta.version,
      };
      try {
        const result = await invokeKnp<{
          ok: boolean;
          reason?: string;
          expires_at?: string | null;
        }>("knp-create-page", body);
        if (result.ok === false && result.reason === "slug_taken") {
          throw new Error("slug_taken");
        }
        if (result.ok === false) throw new Error("create failed");
        return { expires_at: result.expires_at ?? null };
      } catch (error) {
        // Fallback RPC when edge is unavailable (local/dev).
        const message = error instanceof Error ? error.message : String(error);
        if (!/failed to send|not found|404|FunctionsFetchError|Failed to fetch/i.test(message)) {
          throw error;
        }
        const { data, error: rpcError } = await rpc("kodama_create_page", {
          p_slug: command.slug,
          p_ciphertext: bytesToBase64(command.noteEnvelope),
          p_salt: command.saltB64,
          p_iv: "",
          p_kdf_params: command.meta,
          p_burn_mode: command.burnMode,
        });
        if (rpcError) {
          if (rpcError.code === "23505" || /duplicate|unique/i.test(rpcError.message)) {
            throw new Error("slug_taken");
          }
          throw new Error(rpcError.message);
        }
        return { expires_at: (data as { expires_at: string | null }).expires_at };
      }
    },

    async appendProtectedNote(command: AppendProtectedNoteCommand) {
      await invokeKnp("knp-append-version", {
        slug: command.slug,
        ciphertext: bytesToBase64(command.noteEnvelope),
        iv: "",
        kdf_params: command.meta,
        expected_version: command.expectedVersion,
        writer_public_key: command.writerPublicKeyB64,
        state_signature: command.stateSignatureB64,
      });
    },

    async fetchProtectedNote(slug: string) {
      const { data, error } = await rpc("kodama_read_page", { p_slug: slug });
      if (error) throw new Error(error.message);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return { exists: false as const };
      let metaRaw: unknown = row.kdf_params;
      if (typeof metaRaw === "string") {
        try {
          metaRaw = JSON.parse(metaRaw) as unknown;
        } catch {
          throw new Error("not a KNP-1 note");
        }
      }
      if (!isMeta(metaRaw)) {
        throw new Error("not a KNP-1 note");
      }
      return {
        exists: true as const,
        slug: row.slug as string,
        noteEnvelope: base64ToBytes(String(row.ciphertext)),
        saltB64: String(row.salt ?? ""),
        meta: metaRaw,
        burnMode: String(row.burn_mode),
        expiresAt: (row.expires_at as string | null) ?? null,
        updatedAt: String(row.updated_at),
      };
    },
  };
}
