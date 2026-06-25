import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Serve the MSW service worker (used by data-driven component stories).
  staticDirs: ["../public"],
  // Storybook reuses the app's vite.config.ts, which registers VitePWA. The PWA plugin's
  // Workbox precache step fails the Storybook build because Storybook's own manager runtime
  // (sb-manager/globals-runtime.js, ~3.2 MB) exceeds the 2 MiB precache limit — and a docs
  // build needs no service worker anyway. Strip VitePWA from the Storybook build only.
  viteFinal(viteConfig) {
    // VitePWA() contributes a nested array of plugins, so flatten before filtering them out.
    const flatPlugins = (viteConfig.plugins ?? []).flat(Infinity);
    return {
      ...viteConfig,
      plugins: flatPlugins.filter((plugin) => {
        const name = (plugin as { name?: string } | null | undefined)?.name;
        return name === undefined || !name.startsWith("vite-plugin-pwa");
      }),
    };
  },
};

export default config;
