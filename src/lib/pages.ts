// Client-side data access for the encrypted pages backend.
//
// Zero-knowledge contract (KNP-1):
// - Password and private keys never leave the browser.
// - Delivery Gate stores ciphertext + public meta only (never decrypts).
import { supabase } from "@/integrations/supabase/client";
import { assertNoSecretsInPayload } from "@/lib/server-payload";

type KnpEdgeError = { error?: string; ok?: boolean; reason?: string };

async function readEdgeFunctionBody(error: unknown): Promise<KnpEdgeError | null> {
  if (!error || typeof error !== "object") return null;
  const context = (error as { context?: Response }).context;
  if (!(context instanceof Response)) return null;
  try {
    return (await context.clone().json()) as KnpEdgeError;
  } catch {
    return null;
  }
}

function isEdgeFunctionUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to send|not found|404|function.*not.*deploy|FunctionsFetchError|Failed to fetch/i.test(
    message,
  );
}

async function invokeKnpFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  assertNoSecretsInPayload(body, name);
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const edgeBody = await readEdgeFunctionBody(error);
    if (edgeBody?.reason === "slug_taken") {
      return { ok: false, reason: "slug_taken" } as T;
    }
    if (edgeBody?.error) {
      throw new Error(String(edgeBody.error));
    }
    throw error;
  }
  const payload = data as T & KnpEdgeError;
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new Error(String(payload.error));
  }
  return payload;
}

async function createPageViaRpc(input: CreatePageInput): Promise<CreatePageResult> {
  const { data, error } = await rpc("kodama_create_page", {
    p_slug: input.slug,
    p_ciphertext: input.ciphertext,
    p_salt: input.salt,
    p_iv: input.iv,
    p_kdf_params: input.kdf_params,
    p_burn_mode: input.burn_mode,
  });
  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      return { ok: false, reason: "slug_taken" };
    }
    throw new Error(error.message);
  }
  const row = data as { expires_at: string | null };
  return { ok: true, expires_at: row.expires_at };
}

// Generated Supabase types don't yet include our custom RPCs — call untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (name: string, args?: Record<string, unknown>) => {
  if (args) assertNoSecretsInPayload(args, name);
  return (supabase.rpc as any)(name, args);
};

export type SerializableKdfParams =
  | {
      algo: string;
      m: number;
      t: number;
      p: number;
      version: number;
    }
  | Record<string, unknown>;

export type BurnMode = "never" | "after_read" | "1h" | "24h" | "7d";

export const BURN_MODES: { value: BurnMode; label: string; hint: string }[] = [
  { value: "never", label: "Never expires", hint: "Keep forever" },
  { value: "after_read", label: "Burn after first read", hint: "Self-destructs once opened" },
  { value: "1h", label: "Expire in 1 hour", hint: "Auto-deleted after 1h" },
  { value: "24h", label: "Expire in 24 hours", hint: "Auto-deleted after 24h" },
  { value: "7d", label: "Expire in 7 days", hint: "Auto-deleted after 7d" },
];

export type PageRow = {
  id: string;
  slug: string;
  ciphertext: string;
  salt: string;
  iv: string;
  kdf_params: SerializableKdfParams;
  burn_mode: BurnMode;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GetPageResult = { exists: false } | ({ exists: true } & PageRow);

export async function getPage(slug: string): Promise<GetPageResult> {
  const { data, error } = await rpc("kodama_read_page", { p_slug: slug });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { exists: false };
  return hydratePageRow(row);
}

function parseJsonField(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

function hydratePageRow(
  row: Record<string, unknown>,
): Extract<GetPageResult, { exists: true }> {
  const rawKdf = parseJsonField(row.kdf_params);
  return {
    exists: true,
    id: row.id as string,
    slug: row.slug as string,
    ciphertext: row.ciphertext as string,
    iv: (row.iv as string) ?? "",
    salt: row.salt as string,
    kdf_params: (rawKdf ?? {}) as SerializableKdfParams,
    burn_mode: row.burn_mode as BurnMode,
    expires_at: row.expires_at as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export type CreatePageInput = {
  slug: string;
  /** AES-GCM ciphertext produced by encrypt() in the browser — never plaintext. */
  ciphertext: string;
  salt: string;
  iv: string;
  kdf_params: SerializableKdfParams;
  burn_mode: BurnMode;
};

export type CreatePageResult =
  | { ok: true; expires_at: string | null }
  | { ok: false; reason: "slug_taken" };

export async function createPage(input: CreatePageInput): Promise<CreatePageResult> {
  try {
    const result = await invokeKnpFunction<CreatePageResult>("knp-create-page", {
      slug: input.slug,
      ciphertext: input.ciphertext,
      salt: input.salt,
      iv: input.iv,
      kdf_params: input.kdf_params,
      burn_mode: input.burn_mode,
    });
    if (!result.ok && result.reason === "slug_taken") {
      return { ok: false, reason: "slug_taken" };
    }
    if (!result.ok) throw new Error("Failed to create page");
    return result;
  } catch (err) {
    if (isEdgeFunctionUnavailable(err)) {
      return createPageViaRpc(input);
    }
    throw err;
  }
}

/** Append ciphertext version (used by non-protocol callers). Prefer NoteDeliveryClient. */
export async function savePage(args: {
  slug: string;
  ciphertext: string;
  iv: string;
  ksp?: boolean;
  legacyEditToken?: string | null;
}): Promise<{ id: string; created_at: string }> {
  try {
    return await invokeKnpFunction("knp-append-version", {
      slug: args.slug,
      ciphertext: args.ciphertext,
      iv: args.iv ?? "",
      expected_version: -1,
    });
  } catch (err) {
    if (!isEdgeFunctionUnavailable(err)) throw err;
    const { data, error } = await rpc("kodama_ksp_append_version", {
      p_slug: args.slug,
      p_ciphertext: args.ciphertext,
      p_iv: args.iv ?? "",
    });
    if (error) throw new Error(error.message);
    return data as { id: string; created_at: string };
  }
}

export async function updateExpiry(args: {
  slug: string;
  burn_mode: BurnMode;
  ksp?: boolean;
  legacyEditToken?: string | null;
}): Promise<{ burn_mode: BurnMode; expires_at: string | null }> {
  const { data, error } = await rpc("kodama_ksp_update_expiry", {
    p_slug: args.slug,
    p_burn_mode: args.burn_mode,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    burn_mode: row.burn_mode as BurnMode,
    expires_at: row.expires_at,
  };
}

export type AttachmentRow = {
  id: string;
  storage_path: string;
  iv: string;
  filename_ciphertext: string;
  filename_iv: string;
  mime: string;
  size: number;
  created_at: string;
};

export async function listAttachments(slug: string): Promise<AttachmentRow[]> {
  const { data, error } = await rpc("kodama_list_attachments", { p_slug: slug });
  if (error) throw new Error(error.message);
  return (data ?? []) as AttachmentRow[];
}

export async function registerAttachment(args: {
  slug: string;
  storage_path: string;
  iv: string;
  filename_ciphertext: string;
  filename_iv: string;
  mime: string;
  size: number;
  ksp?: boolean;
  legacyEditToken?: string | null;
}): Promise<{ id: string; created_at: string }> {
  const { data, error } = await rpc("kodama_ksp_register_attachment", {
    p_slug: args.slug,
    p_storage_path: args.storage_path,
    p_iv: args.iv,
    p_filename_ciphertext: args.filename_ciphertext,
    p_filename_iv: args.filename_iv,
    p_mime: args.mime,
    p_size: args.size,
  });
  if (error) throw new Error(error.message);
  return data as { id: string; created_at: string };
}

export async function deleteAttachment(args: {
  slug: string;
  attachment_id: string;
  ksp?: boolean;
  legacyEditToken?: string | null;
}): Promise<void> {
  const { error } = await rpc("kodama_ksp_delete_attachment", {
    p_slug: args.slug,
    p_attachment_id: args.attachment_id,
  });
  if (error) throw new Error(error.message);
}
export async function uploadAttachmentBlob(path: string, blob: Blob): Promise<void> {
  const { error } = await supabase.storage
    .from("page-attachments")
    .upload(path, blob, { contentType: "application/octet-stream", upsert: false });
  if (error) throw new Error(error.message);
}

export async function downloadAttachmentBlob(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from("page-attachments").download(path);
  if (error) throw new Error(error.message);
  return data;
}
