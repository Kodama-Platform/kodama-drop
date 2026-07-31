import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-admin.ts";

type KnpMeta = {
  protocol?: string;
  suite?: string;
  owner_public_key?: string;
  version?: number;
  storage_mode?: string;
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
    const salt = body?.salt as string | undefined;
    const iv = (body?.iv as string | undefined) ?? "";
    const kdf_params = body?.kdf_params as KnpMeta | undefined;
    const burn_mode = (body?.burn_mode as string | undefined) ?? "never";

    if (!slug || !ciphertext || !salt || !kdf_params) {
      return jsonResponse({ error: "missing required fields" }, 400);
    }
    if (kdf_params.protocol !== "knp-1" || kdf_params.storage_mode !== "knp-envelope") {
      return jsonResponse({ error: "invalid knp meta" }, 400);
    }
    if (!kdf_params.owner_public_key || typeof kdf_params.owner_public_key !== "string") {
      return jsonResponse({ error: "owner_public_key required" }, 400);
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("kodama_create_page", {
      p_slug: slug,
      p_ciphertext: ciphertext,
      p_salt: salt,
      p_iv: iv,
      p_kdf_params: kdf_params,
      p_burn_mode: burn_mode,
    });

    if (error) {
      if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
        return jsonResponse({ ok: false, reason: "slug_taken" }, 409);
      }
      return jsonResponse({ error: error.message }, 400);
    }

    const row = data as { expires_at: string | null };
    return jsonResponse({ ok: true, expires_at: row.expires_at });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
