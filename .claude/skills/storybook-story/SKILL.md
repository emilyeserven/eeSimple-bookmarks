---
name: storybook-story
description: >-
  Add or update a `.stories.tsx` file for a component in eeSimple Bookmarks — file location and
  naming, the `meta`/`Story` boilerplate, the JSDoc caption convention on each variant, and the
  props-vs-MSW decision rule for fixtures. Use when asked to "add a story for X", "write a
  Storybook story", "add a variant to X's stories", "give this component Storybook coverage", or
  "why does this component's story need MSW". Mirrors `RelationshipTypeGeneralForm.stories.tsx`
  (props-only, no MSW) and `CategoriesListingPage.stories.tsx` (MSW, hook-backed). Cross-links the
  `test-structure` skill's "Stories: MSW handlers" section for the MSW mechanism — this skill does
  not re-document it.
---

# Storybook stories

## File location and naming

- `<ComponentName>.stories.tsx`, colocated **flat** next to the component in
  `packages/client/src/components/` — no `stories/` subfolder.
- `title: "Components/<ComponentName>"` — flat namespace, no sub-paths, matching the component's
  own name exactly.

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
`typeof meta` — this keeps `args` type-checked against the component's actual props.

## JSDoc caption convention

Every non-default story export gets a one-line JSDoc comment directly above it describing what
that variant demonstrates:

```tsx
/** A custom type — name and direction both auto-save. */
export const Default: Story = {};

/** A built-in type — the name field is locked. */
export const BuiltIn: Story = {
  args: { relationshipType: { ...baseType, builtIn: true } },
};
```

## Fixtures: always factories, never inline literals

Build story args from `test-utils/factories.ts` `make*` functions — never hand-write an inline
object literal for an entity. This is the same factory rule CLAUDE.md documents for tests; stories
follow it too, so a shape change to the entity only needs updating in one place.

```tsx
import { makeRelationshipType } from "../test-utils/factories";

const baseType = makeRelationshipType({ id: "rt-sequel", name: "Sequel of", slug: "sequel-of" });
```

## The decision rule: props-only vs. MSW

Before writing a story, determine how the component gets its data:

- **Receives data via props** (a presentational component, e.g. a form given an entity object) →
  build fixtures with `make*` factories only. **No MSW.**

- **Fetches its own data via a hook internally** (e.g. a listing page that calls `useCategories()`)
  → the story **requires MSW**: import `apiHandlers` from `test-utils/story-mocks.ts` and set
  `parameters: { msw: { handlers: apiHandlers } }` on `meta`:

  ```tsx
  import { apiHandlers } from "../test-utils/story-mocks";

  const meta = {
    title: "Components/CategoriesListingPage",
    component: CategoriesListingPage,
    parameters: { msw: { handlers: apiHandlers } },
  } satisfies Meta<typeof CategoriesListingPage>;
  ```

  `apiHandlers` is itself built from the same `make*` factories, so both branches trace back to one
  fixture source. MSW is wired globally in `.storybook/preview.tsx`; a story can extend the handler
  list per-story by spreading `...apiHandlers` alongside a custom `http.get(...)`. For the full
  mechanism (decorators, and why stories mock at the network boundary while tests mock at the hook
  boundary), see the **`test-structure`** skill's "Stories: MSW handlers" section — this skill only
  documents which branch to choose.

## See also

- **`test-structure`** — the MSW handler mechanism, decorators, and the tests-vs-stories mocking
  boundary rule.
