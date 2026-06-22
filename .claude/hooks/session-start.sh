#!/bin/bash
# Claude Code on the web — SessionStart hook.
# Installs all pnpm workspace dependencies so tests, linters, and typechecks
# can run immediately, instead of failing on missing node_modules in a fresh clone.
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions; local sessions manage
# their own node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Ensure pnpm is available. The exact version is pinned via package.json's
# "packageManager" field; corepack provisions it on demand.
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
fi

# Idempotent: re-running reuses the pnpm store and the cached container state.
pnpm install
