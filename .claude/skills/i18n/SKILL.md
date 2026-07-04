---
name: i18n
description: >-
  Externalize and translate UI strings in eeSimple Bookmarks — the react-i18next framework with
  English-phrase (natural) keys, `ja.json` placeholder catalog, locale-aware formatting, and the
  test/Storybook integration. Use when asked to "wrap a string in t()", "make text translatable",
  "add an i18n key", "translate the UI", "why is my new string not translatable", "add a locale",
  "format a date/number in the active locale", or when adding any new user-facing string. Also
  covers the owner-authored-translation rule: automated sessions maintain English-placeholder keys
  but must never write, machine-translate, or overwrite Japanese values.
---

# Internationalization (i18n)

The client renders UI strings through **react-i18next** with **English-phrase keys** — the key *is*
the English text. `t("Save changes")` renders `"Save changes"` when no translation exists, so
untranslated UI looks exactly as it did before i18n, and the existing text assertions / stories pass
unchanged.

- **Library & init:** `packages/client/src/i18n.ts` (init from `I18N_OPTIONS`, imported in
  `main.tsx` before render). `keySeparator`/`nsSeparator` are **off** (a phrase like
  `"Settings: Display"` is one flat key, not a nested path); `fallbackLng: false` makes a missing
  key resolve to the key itself (the English source). `useSuspense: false`.
- **Catalog:** `packages/client/src/locales/ja.json` — a flat `{ "English phrase": "日本語" }` map,
  sorted. There is **no `en.json`** (the key is the English). The single bundled non-source locale.
- **Active locale:** `useAppLocale()` (`hooks/useAppLocale.ts`) returns the live BCP-47 tag
  (`"en"` / `"ja"`), read from i18next. Consumed by locale-aware formatting.

## Adding a new user-facing string

Wrap it in `t()` at write time — this is expected of every new string, not a later sweep:

```tsx
import { useTranslation } from "react-i18next";

function SaveButton() {
  const { t } = useTranslation();
  return <button>{t("Save changes")}</button>;
}
```

Interpolation uses i18next `{{var}}` syntax — **never** template literals inside the key:

```tsx
t("Updated {{label}}", { label }); // ✅  key = "Updated {{label}}"
t(`Updated ${label}`);             // ❌  bakes the value into the key
```

Outside a component (module-level helper), import the app instance: `import i18n from "@/i18n"; i18n.t("…")`.

### The `packages/types` boundary

`packages/types` stays **i18n-free**. Label registries there (`*_LABELS`, option lists) keep their
English strings; translate them **at the client render site** by passing the English label through
`t()` — do not add `t()` or a locale dependency to `@eesimple/types`.

## Locale-aware formatting

Pure formatting helpers take an **optional `locale` param** (a plain arg, not a hook, so they stay
node-env-testable); components pass `useAppLocale()`:

- `lib/datetime.ts` — `formatDateTimeValue(value, format, locale?)` threads the tag into its
  `toLocale*` calls (omit → runtime default). `lib/bookmarkFormat.ts`'s `formatDateTime` forwards it.
  See `components/DateTimePicker.tsx` for the wiring.
- `lib/languageDisplay.ts` — `languageDisplayName(code, locale = "en")` renders `Intl.DisplayNames`
  in the active locale (no catalog entry needed for language names).

The other ~38 incidental `toLocaleString`/`Intl.*` call sites are left for the string-sweep issues.

## Tests & Storybook

- **Tests:** `src/test-utils/setup.ts` imports `../i18n`, initializing it synchronously at `lng: "en"`
  — keys pass through, so no assertion changes are ever needed.
- **Storybook:** `.storybook/preview.tsx` wraps stories in `I18nextProvider` and exposes a **Locale**
  toolbar toggle (`en`/`ja`) via `globalTypes.locale`, so translated states are reviewable.
- **Prove the ja path** with an isolated instance built from `I18N_OPTIONS` + a throwaway in-memory
  `ja` resource (`src/i18n.test.ts`) — assert the switched output. **Never** commit Japanese to
  `ja.json` to test.

## Translation ownership — do not write Japanese

**`ja.json` is owner-authored.** The Japanese strings are written by the repo owner as a learning
exercise. Automated sessions:

- **may** add/maintain English-placeholder **keys** (via #975's sync tooling — every extracted key
  present with its value initialized to a copy of the key; `value === key` means untranslated;
  behavior-neutral because an English-valued entry renders like a missing one), and
- **must never** add, machine-translate, or overwrite Japanese **values**.

If a task would require authoring Japanese, stop and leave it to the owner.
