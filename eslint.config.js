import emilyConfig from "@emilyeserven/eslint-config";
import globals from "globals";

/**
 * Flat ESLint config for eeSimple Bookmarks.
 *
 * Rules come from the shared `@emilyeserven/eslint-config` (the same config used by emstack).
 * Always run `pnpm lint:fix` from the repo root — running from a package produces import
 * ordering that CI rejects.
 */
export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.gen.ts",
      "packages/client/src/routeTree.gen.ts",
      ".claude/skills/fallow/**",
      // Agent worktrees are full repo copies; linting them from the root doubles every
      // finding, and their files fail type-aware parsing (no project service there).
      ".claude/worktrees/**",
      // Fallow's working dir holds generated baselines/caches, not source.
      ".fallow/**",
      // Storybook build output and the generated MSW service worker are not source.
      "**/storybook-static/**",
      "packages/client/public/mockServiceWorker.js",
    ],
  },
  ...(Array.isArray(emilyConfig) ? emilyConfig : [emilyConfig]),
  {
    // Plain-Node JavaScript (gateway entrypoint + repo scripts) runs outside the TS pipeline.
    files: ["packages/gateway/**/*.js", "scripts/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // The gateway and scripts are CLIs — console output is intentional.
      "no-console": "off",
    },
  },
  {
    // Node config files read `process.env` and use side-effect imports (e.g. dotenv).
    files: ["**/*.config.ts", "**/drizzle.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "import/no-unassigned-import": "off",
    },
  },
  {
    // TanStack Router file-based routes export a non-component `Route` object by design,
    // which the fast-refresh rule (dev-only HMR guidance) flags. Disable it for routes.
    files: ["packages/client/src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Test setup registers jest-dom matchers via a side-effect import.
    files: ["packages/client/src/test-utils/**/*.ts"],
    rules: {
      "import/no-unassigned-import": "off",
    },
  },
  {
    // The client owns the only Tailwind entry point; point the better-tailwindcss
    // plugin at it so the shadcn theme tokens (e.g. `text-muted-foreground`) resolve.
    files: ["packages/client/**/*.{ts,tsx}"],
    settings: {
      "better-tailwindcss": {
        entryPoint: "packages/client/src/index.css",
      },
    },
  },
  {
    // Vendored shadcn/ui primitives co-locate components with their variant helpers
    // (e.g. `buttonVariants`) and pull in many Radix imports by design.
    files: ["packages/client/src/components/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
      "import/max-dependencies": "off",
    },
  },
  {
    // Storybook stories and config export a default `meta`/config object and
    // co-locate non-component exports, which the fast-refresh rule flags. Stories
    // also use no-op handler args and `useState` inside `render` for interactivity.
    files: [
      "packages/client/**/*.stories.{ts,tsx}",
      "packages/client/.storybook/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/rules-of-hooks": "off",
      "@typescript-eslint/no-empty-function": "off",
    },
  },
  {
    // The icon helper exports both a component and the icon-name list, and resolves
    // icons by computed name from lucide's `icons` map.
    files: ["packages/client/src/lib/icons.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
      "import/namespace": "off",
    },
  },
];
