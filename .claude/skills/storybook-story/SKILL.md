---
name: storybook-story
description: >-
  Add or update a `.stories.tsx` file for a component in this app — file location and naming, the
  `meta`/`Story` boilerplate, the JSDoc caption convention on each variant, and the props-vs-MSW
  decision rule for fixtures. Use when asked to "add a story for X", "write a Storybook story", "add
  a variant to X's stories", "give this component Storybook coverage", "why does this component's
  story need MSW", or "the Storybook build fails". Mirrors `components/ui/button.stories.tsx`
  (props-only, no MSW) and `components/ItemsManager.stories.tsx` (MSW, hook-backed). Cross-links the
  `test-structure` skill's "Stories: MSW handlers" section for the MSW mechanism — this skill does
  not re-document it.
---

# Storybook stories

Storybook 10 (`@storybook/react-vite`) runs from `packages/client`:

```bash
pnpm --filter=@app/client storybook          # dev server on :6006
pnpm --filter=@app/client build-storybook    # static build — CI's `build` job runs this as the gate
```

Config lives in `packages/client/.storybook/`: `main.ts` globs `../src/**/*.stories.@(ts|tsx)`,
serves `public/` (for the MSW service worker), and strips the VitePWA plugins it would otherwise
inherit from `vite.config.ts` (generating a service worker over Storybook's bundle fails the build).
`preview.tsx` supplies the global decorators — `withI18n` (plus a toolbar `locale` switch, `en`/`ja`),
`withQueryClient`, `withRouter` — and the `mswLoader`. So any story can render components that use
`useTranslation`, TanStack Query hooks, or `<Link>` without extra wrapping.

## File location and naming

- `<ComponentName>.stories.tsx`, colocated **flat** next to the component — no `stories/` subfolder.
- `title` namespaces:
  - `"Components/<ComponentName>"` for app components in `src/components/` (e.g.
    `"Components/ItemsManager"`), matching the component's name exactly, no sub-paths.
  - `"UI/<PrimitiveName>"` for the shadcn primitives in `src/components/ui/` (e.g. `"UI/Button"`).

## Meta/Story boilerplate

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MyComponent } from "./MyComponent";

const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  args: { /* default props, if props-driven */ },
} satisfies Meta<typeof MyComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

Always `satisfies Meta<typeof Component>` (not a bare type annotation), and derive `Story` from
`typeof meta` — this keeps `args` type-checked against the component's actual props. Use
`argTypes` with `control: "select"` for enum-like props (see `ui/button.stories.tsx`'s `variant` /
`size`).

## JSDoc caption convention

Every non-default story export gets a one-line JSDoc comment directly above it describing what that
variant demonstrates (a caption on `Default` is welcome when it adds information):

```tsx
/** A couple of items; descriptions auto-save on blur. */
export const Default: Story = {};

/** The empty state. */
export const Empty: Story = { /* … */ };
```

User-facing strings inside story args should be plain English; the component's own strings go
through `t()` and the `withI18n` decorator renders them (see the **`i18n`** skill).

## Fixtures: always factories, never inline literals

Build story data from `test-utils/factories.ts` `make*` functions (`makeItem`) — never hand-write an
inline object literal for a shared entity. Stories follow the same factory rule as tests, so a shape
change to the entity only needs updating in one place:

```tsx
import { makeItem } from "../test-utils/factories";

const item = makeItem({ id: "item-2", name: "Second item", description: "With a description" });
```

## The decision rule: props-only vs. MSW

Before writing a story, determine how the component gets its data:

- **Receives data via props** (a presentational component or primitive) → set `args`, building any
  entity fixtures with `make*` factories. **No MSW.** Reference: `components/ui/button.stories.tsx`.

- **Fetches its own data via a hook internally** (e.g. `ItemsManager`, which calls `useItems()` and
  the item mutations) → the story **requires MSW**: import `apiHandlers` from
  `test-utils/story-mocks.ts` and set `parameters: { msw: { handlers: apiHandlers } }` on `meta`.
  Reference: `components/ItemsManager.stories.tsx`:

  ```tsx
  import { http, HttpResponse } from "msw";

  import { apiHandlers } from "../test-utils/story-mocks";

  const meta = {
    title: "Components/ItemsManager",
    component: ItemsManager,
    parameters: { msw: { handlers: apiHandlers } },
  } satisfies Meta<typeof ItemsManager>;

  /** The empty state. */
  export const Empty: Story = {
    parameters: {
      msw: { handlers: [http.get("/api/items", () => HttpResponse.json([])), ...apiHandlers] },
    },
  };
  ```

  `apiHandlers` is itself built from the same `make*` factories (`sampleItems`), so both branches
  trace back to one fixture source. A per-story override puts its own handler **first** and spreads
  `...apiHandlers` after it. When a component starts reading a new endpoint, add a default handler
  for it to `apiHandlers` rather than repeating it per story. For the full mechanism (decorators, and
  why stories mock at the network boundary while tests stub `fetch` / mock modules), see the
  **`test-structure`** skill's "Stories: MSW handlers" section.

MSW (`msw`, `http`, `HttpResponse`) is imported **only** in `.stories.tsx` files and
`test-utils/story-mocks.ts` — never in a `.test.*` file.

## See also

- **`test-structure`** — the MSW handler mechanism, decorators, and the tests-vs-stories mocking
  boundary rule.
- **`i18n`** — the `withI18n` decorator and the `ja` locale toolbar switch.
