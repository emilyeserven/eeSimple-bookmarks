import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

// jsdom by default — the fill engine and selector picker read a real DOM. Pure tests opt into the
// faster node environment with a `// @vitest-environment node` pragma (like the client).
export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
