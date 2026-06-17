import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Serve the MSW service worker (used by data-driven component stories).
  staticDirs: ["../public"],
};

export default config;
