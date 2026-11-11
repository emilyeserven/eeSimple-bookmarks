import { defineConfig } from "wxt";

/*
 * WXT build for the eeSimple browser extension (Chrome / Edge, Manifest V3).
 * Docs: https://wxt.dev/guide/essentials/config/manifest
 *
 * Host access is deliberately minimal: no `host_permissions` at all. `activeTab` covers the page the
 * user clicked the toolbar icon on (fill engine + selector picker injection, screenshots), and
 * `optional_host_permissions` lets the popup request exactly the configured server's host (on Save)
 * and an image's host (on Apply) at runtime — see `src/lib/hostAccess.ts`.
 */
export default defineConfig({
  srcDir: "src",
  manifestVersion: 3,
  // Explicit imports everywhere (no auto-import magic), matching the rest of the monorepo.
  imports: false,
  manifest: {
    name: "eeSimple Bookmarks",
    description: "Save the current page or any link to eeSimple Bookmarks.",
    permissions: ["activeTab", "storage", "contextMenus", "notifications", "scripting"],
    optional_host_permissions: ["http://*/*", "https://*/*"],
  },
  zip: {
    artifactTemplate: "eesimple-extension.zip",
  },
});
