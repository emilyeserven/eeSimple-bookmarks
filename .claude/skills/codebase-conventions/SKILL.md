---
name: codebase-conventions
description: >-
  Repo-wide coding conventions for eeSimple Bookmarks — the ESLint import cap and its exemptions, Conventional Commits and PR titles, git hooks, shared test factories, `.js` extensions in @eesimple/types, `as const` tuple-derived unions, Add Bookmark form placement, UI primitives, Card Display Rules, the API error envelope, shared payload types, deprecation sunset, and generated files. Use when asked "what's the convention for X", before adding a string union that crosses packages, when lint/commitlint/pr-title/pre-push fails, or when unsure where a new type belongs.
---

# Work within the repo-wide conventions

This skill holds guidance that used to live in the root `CLAUDE.md`. The full text is in [`reference.md`](reference.md) beside this file — read the section that matches your change before editing code in this area. Sections:

- Tech stack (full detail, incl. test projects and test-double rules)
- Monorepo layout
- Conventions (every rule bullet)
- Generated files (do not edit)
