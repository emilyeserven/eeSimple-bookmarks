---
name: extension-fill-target
description: >-
  Add a new fill target kind to the browser-extension "check & fill" (Extension Fill) feature in
  eeSimple Bookmarks — a `FillTarget` variant a per-website rule can extract into (like the existing
  field / customProperty / taxonomy / publisher / image / taxonomyEntity / taxonomyDirect / sections
  kinds). Use when asked to "add an extension fill target", "let a fill rule write into X", "add a
  new FillTarget kind", "extend the extension popup's check & fill", "add a target to the Extension
  Fill rules editor", or "why does my new fill target 400 / not appear in the popup". This is the
  app's most-churned subsystem: the TS union is the anchor and the extension (`packages/extension`,
  typed TypeScript built with WXT) now switches on it exhaustively, but the wire schema and the
  editor's kind dropdown are still HAND-MAINTAINED copies — those are the silent sync points. Also
  covers maintaining the feature — "the fill target drops a field on save", "a fill kind renders as
  unsupported in the popup".
---

# Add an Extension Fill target kind

The Extension Fill feature (`#1242`+) lets a browser-extension popup read values off a live page and
"check & fill" them into the matching bookmark (or a linked taxonomy term), driven by per-website
`extensionFillRules`. A **`FillTarget`** is the discriminated-union of *what a rule writes into*. New
kinds land often (field → customProperty → taxonomy → publisher → image → taxonomyEntity →
taxonomyDirect → sections), each repeating the same cross-file lockstep.

**There is no top-of-file spec doc block and no CLAUDE.md section for this feature.** The nearest spec
is the doc-comment on the `FillTarget` union itself (`packages/types/src/extensionFill.ts`). When you
add a kind, add a doc-comment arm there — that file *is* the de-facto spec.

## The one thing to internalize

The TS `FillTarget` union is the trustworthy anchor. It is consumed by **exhaustive
`switch (target.kind)` statements** — four in the client editor and one in the extension popup's
`buildRow` — those are your compiler tripwires; miss one and `tsc` fails. **What's left is a
parallel hand-maintained copy with no compiler net:** the Fastify wire schema, the editor's
kind-dropdown option list, and the middleware context assembly. Most Extension Fill regressions
originate in those silent copies, so treat this skill's "silent" steps as the real work.

The browser extension is its own package, **`packages/extension`** (WXT + TypeScript, typed against
`@eesimple/types`). It imports `TAXONOMY_ENTITY_SPECS` directly — there is no hand-copied registry
mirror any more — and the web app's in-app rule preview (`client/src/lib/fillEnginePreview.ts`) and
Transforms preview (`fillTransformPreview.ts`) import the extension's engine via
`@eesimple/extension/fill`, so preview and real fill run the same code.

> **There is no `as const` tuple of `FillTarget` kinds.** Unlike *associations*
> (`TAXONOMY_ENTITY_ASSOCIATIONS`, which drives a `satisfies` check), the kind list lives in two
> uncross-checked places: the TS union and the JSON-schema `enum`. A kind added to the type but
> forgotten in the schema **compiles fine and silently 400s the PATCH at runtime.**

## Ordered checklist

### 1. Shared type — the anchor (compiler-enforced)
`packages/types/src/extensionFill.ts` — add your `| { kind: "yourKind"; … }` arm to the `FillTarget`
union, with a doc-comment. Every exhaustive switch below now fails `tsc` until updated.
- If the kind carries new data back to the popup, extend `ExtensionFillContext` and/or
  `TaxonomyEntityTermRef` (in `extensionFillTaxonomy.ts`) with the payload.
- If the kind draws on taxonomy entities/fields, the registry is `extensionFillTaxonomy.ts`
  (`TAXONOMY_ENTITY_SPECS`, guarded by `satisfies Record<TaxonomyEntityAssociation, …>`, plus the
  `as const` tuples and label maps). **Adding a new *association* or *field* is a separate,
  `satisfies`-enforced lockstep from adding a *kind*** — don't conflate them.

### 2. Wire validation schema — SILENT (hand-maintained AJV, not type-checked)
`packages/middleware/src/routes/websites.ts`, `const fillTargetSchema`. It is **one
`additionalProperties: false` object over the union of all kinds' fields**, plus per-kind `if/then`
required-field enforcement (NOT a `oneOf`). Three edits:
1. Add your kind string to the `kind` `enum`.
2. Add any NEW field names your kind introduces to the `properties` block — else
   `additionalProperties: false` **rejects them and the PATCH 400s**.
3. Add an `allOf` branch `{ if: { properties: { kind: { const: "yourKind" } } }, then: { required: […] } }`
   mirroring the existing per-kind branches.

> **Known drift to learn from:** the `sections` target's `itemUrl` exists in the TS type, the editor,
> and the fill engine, but is **missing from this schema's `properties` and from the client
> normalizer's `cleanSectionsTarget`** — so it silently never persists. That is the exact failure mode
> this step guards against: **the client normalizer (step 3) must emit exactly the fields this schema
> allows, no more, no less.**

### 3. Client editor form logic — compiler-enforced (3 exhaustive switches)
`packages/client/src/lib/extensionFillForm.ts`:
- `coerceFillTarget` — add a `case "yourKind"` (extract a `coerceYourKindTarget` helper if
  non-trivial, mirroring `coerceCustomPropertyTarget` / `coerceTaxonomyEntityTarget` /
  `coerceTaxonomyDirectTarget` / `coerceSectionsTarget`). Rebuilds the target when the kind select
  changes, preserving same-kind values.
- `cleanTarget` — add a `case "yourKind"` returning the **schema-clean** payload (exactly step 2's
  allowed fields) or `null` when the rule is incomplete (extract a `cleanYourKindTarget` helper). This
  is what keeps `additionalProperties: false` from 400ing.
- `describeFillTarget` — add a `case "yourKind"` for the collapsed rule-card summary.
- Add any label map entry (`FIELD_LABELS` / `TAXONOMY_LABELS` / `SECTION_FILL_ENTRY_TYPE_LABELS`).

### 4. Client editor UI — one compiler anchor + one silent dropdown
`packages/client/src/components/extensionFill/FillTargetPicker.tsx`:
- `FillTargetValue` switch (no `default`, compiler-enforced) — add a `case "yourKind"` rendering the
  per-kind value control (a `YourKindTarget` sub-component like `TaxonomyEntityTarget` /
  `TaxonomyDirectTarget` / `SectionsTarget`).
- **SILENT:** the kind dropdown's `KindSelect options={[…]}` is a plain literal, **not** checked
  against the union — add `{ value: "yourKind", label, description }` or the kind never appears in the
  UI. Check `FillRuleFields.tsx` too if your kind needs a different extract editor.

### 5. Middleware fill-context assembly — SILENT (`if`-branch, not exhaustive on kind)
`packages/middleware/src/services/extensionFill.ts` — `getExtensionFillContext`. The per-kind
branching here is `if (rule.target.kind === "yourKind")`, not a checked switch (the exhaustive
switches in this file key on *association*, so they only trip `tsc` for a new association). Add a
branch + loader only if your kind needs server-side context data. Mirror the existing helpers:
`loadTaxonomyOptions` (taxonomy/publisher option lists), `buildAssociationHydration` +
`loadBaseTermsFor` (taxonomyEntity term hydration), `resolveNoBookmarkContext` / `buildTaxonomyMode`
(the `mode:"taxonomy"` no-bookmark path), and the property-id collection near the top (extend it if
your kind references a `propertyId`, like `customProperty`/`sections`).

### 6. The popup — compiler-enforced dispatch, but check the apply phase
`packages/extension/src/popup/fill/` (typed modules):
- **Dispatch:** `buildRow.ts` is an exhaustive `switch (target.kind)` — a new kind fails `tsc` until
  it has a builder. (At runtime a kind from a *newer server* still renders as a disabled
  "unsupported" row rather than throwing.)
- **Row builder:** add `buildYourKindRow` beside its siblings — bookmark writes in `bookmarkRows.ts`
  / `propertyRows.ts`, linked-term writes in `entityRows.ts`, page-resolved entity writes in
  `directRows.ts`. Rows are `FillRow`s (`rowTypes.ts`); start from `baseRow` / `diffRow`.
- **Apply:** `apply.ts` partitions checked rows by marker prop (`row.image` / `row.entity` /
  `row.directEntity`; none = the bookmark-PATCH bucket via `row.apply(patch, state)`) and runs the
  phase appliers (`entityApply.ts`: linked-term PATCHes, language writes, direct entity updates; then
  image uploads). A kind with a non-standard write path needs a new marker + phase + a
  `summarizeApply` line. **Host access:** the extension holds no blanket host permission — a phase
  that downloads from a third-party host must have its URLs covered by `requestImageHostAccess` (run
  synchronously in the Apply click), or the fetch fails CORS.

### 7. Fill engine (extraction runtime) — typed
`packages/extension/src/lib/fill/fillEngine.ts` — `runRules` dispatches structured-result kinds
(`sections` → `runSectionsRule`, `taxonomyDirect` → `resolveValue`) vs. the flat-value path. Add a
branch only if your kind produces a **structured** result (extend `FillRunResult`). The transform
runtime is `fillTransforms.ts` — the single implementation the client preview also runs, so a new
`FillTransform` kind is one edit there (its `switch` fails `tsc` when a kind is missing).

### 8. Tests
- `packages/client/src/lib/extensionFillForm.test.ts` — add coerce/clean/describe cases for your kind
  (this is the net for step 3).
- `packages/middleware/src/tests/extensionFill.test.ts` — add context-assembly coverage if step 5
  changed.
- `packages/extension/src/lib/fill/fillEngine.test.ts` — engine extraction (jsdom).
- `packages/extension/src/popup/fill/buildRow.test.ts` — the row builder's diff + apply for your kind.
- Then `pnpm --filter=@eesimple/extension build` and load `packages/extension/.output/chrome-mv3`
  unpacked to exercise the kind end to end (injection and the permission prompts aren't unit-testable).

## Compiler-enforced vs silent (the summary that matters)

**Fails `tsc` if you miss it (free):** the `FillTarget` union; the `coerceFillTarget` / `cleanTarget`
/ `describeFillTarget` switches; the `FillTargetValue` switch; the extension's `buildRow` switch.

**Ships a runtime bug if you miss it (the real work):** the Fastify schema `enum` + `properties` +
`allOf` branch (400s the PATCH); the kind-dropdown option literal (invisible in UI); the client
normalizer completeness vs schema (dropped field, à la `itemUrl`); the middleware `getExtensionFillContext`
branches (empty popup rows); a non-standard write path in the popup's `apply.ts` partitioning; host
access for any new third-party download.
