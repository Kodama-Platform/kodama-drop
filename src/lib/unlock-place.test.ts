import { describe, expect, it } from "vitest";

import type { ExistingPage } from "@/lib/page-query";
import { unlockPlace } from "@/lib/unlock-place";

describe("unlockPlace", () => {
  it("rejects non-KNP pages", async () => {
    const page = {
      exists: true as const,
      id: "1",
      slug: "legacy",
      ciphertext: "x",
      salt: "s",
      iv: "i",
      kdf_params: { algo: "argon2id", m: 1, t: 1, p: 1, version: 1 },
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      burn_mode: "never" as const,
      expires_at: null,
    } satisfies ExistingPage;

    await expect(unlockPlace({ page, password: "x" })).rejects.toThrow(/not KNP-1/);
  });
});
