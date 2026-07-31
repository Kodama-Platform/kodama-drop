import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type KnpMeta = {
  protocol?: string;
  storage_mode?: string;
  owner_public_key?: string;
  version?: number;
  state?: { header?: { signatureB64?: string; version?: number } };
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const slug = body?.slug as string | undefined;
    const ciphertext = body?.ciphertext as string | undefined;
    const iv = (body?.iv as string | undefined) ?? "";
    const kdf_params = body?.kdf_params as KnpMeta | undefined;
    const expected_version = body?.expected_version as number | undefined;
    const writer_public_key = body?.writer_public_key as string | undefined;
    const state_signature = body?.state_signature as string | undefined;

    if (!slug || !ciphertext || !kdf_params || expected_version === undefined) {
      return jsonResponse({ error: "missing required fields" }, 400);
    }
    if (kdf_params.protocol !== "knp-1" || kdf_params.storage_mode !== "knp-envelope") {
      return jsonResponse({ error: "invalid knp meta" }, 400);
    }
    if (!writer_public_key || !state_signature) {
      return jsonResponse({ error: "writer signature required" }, 400);
    }
    if ((kdf_params.version ?? -1) !== expected_version + 1) {
      return jsonResponse({ error: "version mismatch" }, 409);
    }

    const supabase = createServiceClient();
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("id, slug, kdf_params, burned")
      .eq("slug", slug)
      .maybeSingle();

    if (pageError) return jsonResponse({ error: pageError.message }, 500);
    if (!page || page.burned) return jsonResponse({ error: "page not found" }, 404);

    const current = page.kdf_params as KnpMeta;
    if (current?.protocol !== "knp-1") {
      return jsonResponse({ error: "not a knp place" }, 400);
    }
    if ((current.version ?? 0) !== expected_version) {
      return jsonResponse({ error: "expected_version stale" }, 409);
    }

    // Availability gate: require owner writer for this cutover (editor certs verified client-side).
    if (writer_public_key !== current.owner_public_key) {
      return jsonResponse({ error: "writer not authorized" }, 403);
    }

    const { data, error } = await supabase.rpc("kodama_ksp_append_version", {
      p_slug: slug,
      p_ciphertext: ciphertext,
      p_iv: iv,
    });

    if (error) return jsonResponse({ error: error.message }, 400);

    // Persist updated KNP meta (RPC may only bump ciphertext — update kdf_params explicitly).
    const { error: metaError } = await supabase
      .from("pages")
      .update({ kdf_params })
      .eq("slug", slug);
    if (metaError) return jsonResponse({ error: metaError.message }, 400);

    return jsonResponse(data ?? { ok: true });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
