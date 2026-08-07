import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

import { devTlsOptions } from "./scripts/dev-tls.ts";

const tls = devTlsOptions();
const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const kscRoot = path.resolve(repoRoot, "../kodama-security-core/packages");
const useLocalKsc = fs.existsSync(path.join(kscRoot, "core/src/index.ts"));
// Keep Vite's optimize-deps cache off Dropbox — sync/locks cause empty deps + 504s.
const viteCacheDir = path.join(
  process.env.LOCALAPPDATA || process.env.TMPDIR || "/tmp",
  "kodama-note-vite",
);

// Pure SPA build — outputs static assets to dist/ for AWS Amplify.
export default defineConfig({
  cacheDir: viteCacheDir,
  resolve: {
    alias: {
      "@": path.resolve(repoRoot, "src"),
      ...(useLocalKsc
        ? {
            "@kodama.page/core": path.join(kscRoot, "core/src/index.ts"),
            "@kodama.page/security-browser": path.join(
              kscRoot,
              "security-browser/src/index.ts",
            ),
          }
        : {}),
    },
  },
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 8080,
    strictPort: false,
    allowedHosts: true,
    // Behind the preview HTTPS ingress; point HMR at the public wss endpoint.
    hmr: { clientPort: 443, protocol: "wss" },
    ...(tls ? { https: tls } : {}),
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 8080,
    strictPort: false,
    allowedHosts: true,
    ...(tls ? { https: tls } : {}),
  },
  optimizeDeps: {
    include: ["@kodama.page/core", "@kodama.page/security-browser", "hash-wasm"],
    exclude: ["brotli-wasm"],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "esnext",
  },
});
