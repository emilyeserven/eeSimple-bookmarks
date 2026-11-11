---
name: deployment-env
description: >-
  Deployment and environment variables for eeSimple Bookmarks — the gateway pattern (single production entrypoint spawning the middleware, `drizzle-kit push` on boot, listen-before-boot-steps ordering) and the full environment variable table (database, docs, object storage, Tier 2 connectors, ArchiveBox/Kavita/Plex, map tiles, geocoding). Use when adding or changing an env var, a boot step, the Dockerfile/gateway, or when asked how a setting is configured in production.
---

# Deploy and configure the app

This skill holds guidance that used to live in the root `CLAUDE.md`. The full text is in [`reference.md`](reference.md) beside this file — read the section that matches your change before editing code in this area. Sections:

- Deployment
- Environment variables
