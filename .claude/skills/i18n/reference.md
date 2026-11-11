# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Internationalization

The client UI is translated with **react-i18next** using **English-phrase (natural) keys** — wrap
every user-facing string in `t()` (or `i18n.t()` outside components); the key *is* the English
phrase, so an untranslated locale falls back to readable English.
`packages/client/src/locales/ja.json` is the Japanese catalog: most values are English placeholders
awaiting translation, and **owner-authored Japanese values are sacred** — automated sessions may
add/prune placeholder keys but must never write, machine-translate, or overwrite a real Japanese
value. Tooling (`scripts/i18n.mjs`): `pnpm i18n:extract` registers new keys, `pnpm i18n:status`
reports coverage + orphaned keys, `pnpm i18n:check-stale` finds translated keys whose source string
no longer exists. CI runs a dedicated **advisory** `i18n` job that writes coverage to the step
summary and deliberately never fails the PR — nothing automatically catches a missed `t()`, so the
wrap-everything rule is review-enforced. See the **`i18n`** skill for locale-aware formatting and
the test/Storybook integration.
