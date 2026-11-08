/// <reference types="vitest/config" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// --- Test-file partition for the three-project Vitest split (see the `test` block below). ---
// Mock-free files run with `isolate: false` (persistent workers: jsdom + the module graph are
// created once per worker instead of once per file — the bulk of the suite's former cost).
// Files using module mocks or global stubs keep default per-file isolation; project scoping
// guarantees their workers are never shared with fast-project files, so leakage into the fast
// path is impossible by construction.
// Caveat: this partition is computed at config load. In watch mode, adding a `vi.mock`/stub
// call to a previously mock-free file doesn't reclassify it until the vitest process restarts.
// CI and `vitest run` always cold-load the config, so they always see the correct partition.
function listTestFiles(dir: string): string[] {
  return readdirSync(dir, {
    withFileTypes: true,
  }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listTestFiles(path);
    return /\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const allTestFiles = listTestFiles(fileURLToPath(new URL("./src", import.meta.url)));
// Anything that mutates worker-global state vitest only resets under isolation: module mocks
// (the mocker registry is worker-global) and global/env/time stubs.
const usesIsolationDependentApi = (src: string) =>
  /\bvi\.(mock|doMock|unmock|hoisted|stubGlobal|stubEnv|setSystemTime)\s*\(/.test(src);
const hasNodePragma = (src: string) => src.includes("@vitest-environment node");

const mockedFiles: string[] = [];
const nodeFastFiles: string[] = [];
const domFastFiles: string[] = [];
for (const file of allTestFiles) {
  const src = readFileSync(file, "utf8");
  if (usesIsolationDependentApi(src)) mockedFiles.push(file);
  else if (hasNodePragma(src)) nodeFastFiles.push(file);
  else domFastFiles.push(file);
}
if (mockedFiles.length + nodeFastFiles.length + domFastFiles.length !== allTestFiles.length) {
  throw new Error("Test partition lost files — fix the classifier in vite.config.ts");
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    // The router plugin must run before the React plugin.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    // PWA shell: makes the app installable and lets new deploys auto-apply on the next load.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      workbox: {
        // SPA navigation fallback, but never shadow the gateway's API/docs/storybook routes.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/docs/, /^\/storybook/],
      },
      manifest: {
        name: "App",
        short_name: "App",
        description: "A self-hosted app.",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  test: {
    globals: true,
    // No test asserts on real CSS (the one getComputedStyle consumer stubs it), so skip CSS
    // processing entirely.
    css: false,
    setupFiles: ["./src/test-utils/setup.ts"],
    // groupOrder phases the projects (node -> dom -> mocked) so workers of one environment
    // finish before the next starts — interleaving environments would churn the persistent
    // workers that `isolate: false` relies on.
    projects: [
      {
        extends: true,
        test: {
          name: "node-fast",
          environment: "node",
          include: nodeFastFiles,
          isolate: false,
          sequence: {
            groupOrder: 0,
          },
        },
      },
      {
        extends: true,
        test: {
          name: "dom-fast",
          environment: "jsdom",
          include: domFastFiles,
          isolate: false,
          sequence: {
            groupOrder: 1,
          },
        },
      },
      {
        extends: true,
        test: {
          name: "mocked",
          environment: "jsdom", // per-file `@vitest-environment node` pragmas still win
          include: mockedFiles,
          pool: "threads", // isolated per-file workers; threads spawn cheaper than forks
          sequence: {
            groupOrder: 2,
          },
        },
      },
    ],
  },
});
