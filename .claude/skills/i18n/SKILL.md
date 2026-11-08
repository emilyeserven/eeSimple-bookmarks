---
name: i18n
description: >-
  Externalize and translate UI strings in this repo — react-i18next with English-phrase (natural)
  keys, the `packages/client/src/locales/ja.json` placeholder catalog, the `pnpm i18n:extract` /
  `i18n:status` / `i18n:check-stale` tooling, locale-aware formatting, and the test/Storybook
  integration. Use when asked to "wrap a string in t()", "make text translatable", "add an i18n key",
  "translate the UI", "why is my new string not translatable", "add a locale", "format a date/number
  in the active locale", or when adding any new user-facing string. Also covers the
  owner-authored-translation rule: automated sessions maintain English-placeholder keys but must
  never write, machine-translate, or overwrite Japanese values.
---

# Internationalization (i18n)

The client renders UI strings through **react-i18next** with **English-phrase keys** — the key *is*
the English text. `t("Save changes")` renders `"Save changes"` when no translation exists, so
untranslated UI looks exactly like English source, and text assertions / stories pass unchanged.

- **Init:** `packages/client/src/i18n.ts` — `I18N_OPTIONS` + a synchronous `i18next.init`, imported
  by `main.tsx` before the first render. `SUPPORTED_LOCALES = ["en", "ja"]`, `DEFAULT_LOCALE = "en"`.
  `keySeparator`/`nsSeparator` are **off** (`"Settings: Display"` is one flat key, not a nested path);
  `fallbackLng: false` makes a missing key resolve to the key itself; `returnEmptyString: false` makes
  an empty value fall through to the key; `useSuspense: false` (nothing async to await).
- **Catalog:** `packages/client/src/locales/ja.json` — a flat, sorted `{ "English phrase": "日本語" }`
  map. There is **no `en.json`** — the key is the English.
- **Active locale:** read it from i18next (`useTranslation().i18n.language`, or `i18n.language`
  outside React).

## Adding a new user-facing string

Wrap it in `t()` when you write it — every new string, not a later sweep. Nothing in CI fails on a
missed `t()`, so this is review-enforced.

```tsx
import { useTranslation } from "react-i18next";

function SaveButton() {
  const { t } = useTranslation();
  return <button>{t("Save changes")}</button>;
}
```

Interpolation uses i18next `{{var}}` syntax — **never** a template literal inside the key:

```tsx
t("Delete {{name}}", { name });   // ✅  key = "Delete {{name}}"
t(`Delete ${name}`);              // ❌  bakes the value into the key; not extractable
```

Outside a component (a module-level helper, a mutation callback), import the app instance:
`import i18n from "@/i18n"; i18n.t("…")`. References: `hooks/useItems.ts` (toast messages),
`lib/autoSave.ts` (translates the field label as its own key), `lib/errorMessages.ts` (one literal
`i18n.t("…")` per error code so the phrases stay statically extractable).

Rules of thumb:

- **Never `t()`-wrap user data** (an entity's stored name, a server-supplied message). Translate
  chrome, not content.
- **Keep keys literal.** `t(someVariable)` can't be extracted. When a label must be passed around as
  data, pass the English phrase and translate it at the render/notify site (as `notifyFieldSaved`
  does with `i18n.t(label)`).
- **Server error text stays English by design.** The middleware is i18n-free; the client maps
  error `code`s to phrases in `lib/errorMessages.ts` (see the `api-errors` skill).

### The `packages/types` boundary

`@app/types` stays **i18n-free**. Any label registry there (an `*_LABELS` record, option lists)
keeps its English strings; translate at the client render site by passing the English label through
`t()`. Never add `t()` or an i18next dependency to `@app/types` or `@app/middleware`.

## Keeping `ja.json` in sync

`scripts/i18n.mjs` (over `scripts/lib/i18nKeys.mjs`, a TypeScript-Compiler-API walk of
`packages/client/src` — no extra dependency):

- **`pnpm i18n:extract`** — collects every static `t("…")` / `i18n.t("…")` key and adds any missing
  one to `ja.json` with an English-placeholder value (`"key": "key"`), keeps the file sorted, and
  **never touches an existing value**. Run it after adding `t()` calls, before committing. It warns
  (never fails) for call sites it can't resolve: a template-literal key (forbidden — rewrite with
  `{{var}}`) or a dynamic key (needs a manual look).
- **`pnpm i18n:status`** — translated vs. untranslated counts, untranslated grouped by source
  directory. Always exits 0 — untranslated is a normal, permanent state.
- **`pnpm i18n:check-stale`** — flags `ja.json` keys no longer referenced by any `t()` call.
  Untranslated stale keys are safe to remove; **translated** stale keys get a loud warning (the
  phrase was probably renamed and the translation is worth carrying over). Exits 0 unless run with
  `--fail-on-stale`.

CI's `i18n` job in `.github/workflows/ci.yml` runs `status` + `check-stale` into the step summary and
is **advisory** — it never fails the PR.

## Locale-aware formatting

Keep formatting helpers **pure**: take an optional `locale` argument (a plain param, not a hook) and
pass it to `Intl.*` / `toLocale*`, so the helper stays testable under the `node` Vitest environment.
Components supply the active locale from `useTranslation().i18n.language`. For language names, use
`Intl.DisplayNames` in the active locale rather than adding catalog entries.

## Tests & Storybook

- **Tests:** `src/test-utils/setup.ts` imports `../i18n`, which initializes synchronously at `"en"` —
  keys pass through, so assertions use the English phrase verbatim.
- **Storybook:** `.storybook/preview.tsx` wraps stories in `I18nextProvider` and exposes a **Locale**
  toolbar toggle (`globalTypes.locale`, `en`/`ja`) so translated states are reviewable.
- **Prove the ja path** with an isolated instance (`createInstance()` + `I18N_OPTIONS`) and a
  throwaway in-memory `ja` resource, as `src/i18n.test.ts` does. **Never** commit Japanese to
  `ja.json` to make a test pass.

## Translation ownership — do not write Japanese

**`ja.json` values are owner-authored** (the repo owner writes the Japanese). Automated sessions:

- **may** add English-placeholder **keys** via `pnpm i18n:extract` (`value === key` means
  untranslated; behavior-neutral, since an English-valued entry renders like a missing one), and may
  remove an **untranslated** stale key reported by `pnpm i18n:check-stale`;
- **must never** add, machine-translate, or overwrite a Japanese **value**, and must never delete a
  **translated** stale key without owner confirmation.

If a task would require authoring Japanese, stop and leave it to the owner.
