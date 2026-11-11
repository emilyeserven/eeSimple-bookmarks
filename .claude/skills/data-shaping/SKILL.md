---
name: data-shaping
description: >-
  Decide where data shaping belongs in eeSimple Bookmarks — middleware services (counts, trees, batched hydration, the shared-predicate bookmark cache, paginated bookmark search) vs. the sanctioned client-side exceptions, plus the `invalidateBookmarkCache()` rule. Use when a component joins/groups/aggregates/builds a tree, when adding server-side filtering, when a write should invalidate the bookmark cache, or when asked "should this be an endpoint?".
---

# Shape data in the right layer

This skill holds guidance that used to live in the root `CLAUDE.md`. The full text is in [`reference.md`](reference.md) beside this file — read the section that matches your change before editing code in this area. Sections:

- Data shaping: middleware vs. client
