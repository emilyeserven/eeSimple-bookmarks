import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

// VitePWA's plugins (vite.config.ts) are named `vite-plugin-pwa…`. Storybook nests plugins, so flatten.
const isPwaPlugin = (plugin: PluginOption): boolean =>
  Boolean(plugin)
  && typeof plugin === "object"
  && "name" in plugin
  && typeof plugin.name === "string"
  && plugin.name.startsWith("vite-plugin-pwa");

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Serve the MSW service worker (used by data-driven component stories).
  staticDirs: ["../public"],
  // Storybook inherits the app's vite.config.ts, which registers VitePWA. Generating a PWA service
  // worker over Storybook's own bundle is pointless and fails the build: Storybook's manager runtime
  // (`sb-manager/globals-runtime.js`, ~3.2 MB) exceeds Workbox's 2 MiB precache limit and throws.
  // Strip the PWA plugins out of the Storybook build.
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = (viteConfig.plugins ?? []).filter(
      plugin => !(Array.isArray(plugin) ? plugin.some(isPwaPlugin) : isPwaPlugin(plugin)),
    );
    return viteConfig;
  },
};

export default config;
