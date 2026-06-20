#!/usr/bin/env node
// Drift gate for the vendored fallow skill. `.claude/skills/fallow` is a committed copy of the
// skill that ships inside the `fallow` npm package (synced by `pnpm fallow:sync-skill`). This check
// fails if the two have diverged — e.g. after a `fallow` bump without a re-sync — so CI turns the
// PR red until `pnpm fallow:sync-skill` is run and committed. Verify, don't mutate: this never
// edits tracked files. Mirrors the `scripts/verify-changed.mjs` convention.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SOURCE = "node_modules/fallow/skills/fallow";
const VENDORED = ".claude/skills/fallow";
const FIX = "pnpm fallow:sync-skill (then commit .claude/skills/fallow)";

if (!existsSync(SOURCE)) {
  // No installed fallow package (e.g. a partial local checkout). Skip rather than fail confusingly;
  // CI installs deps before running this, so the gate still holds there.
  console.log(`fallow skill check skipped: ${SOURCE} not found. Run \`pnpm install\` first.`);
  process.exit(0);
}

if (!existsSync(VENDORED)) {
  console.error(`fallow skill check FAILED: ${VENDORED} is missing. Run: ${FIX}`);
  process.exit(1);
}

/** Recursively list files under `dir`, returned as paths relative to `dir`, sorted. */
function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) {
      out.push(...listFiles(abs).map(child => join(entry, child)));
    }
    else {
      out.push(entry);
    }
  }
  return out.sort();
}

const sourceFiles = listFiles(SOURCE);
const vendoredFiles = listFiles(VENDORED);
const differences = [];

for (const file of sourceFiles) {
  if (!vendoredFiles.includes(file)) {
    differences.push(`missing in ${VENDORED}: ${file}`);
    continue;
  }
  if (readFileSync(join(SOURCE, file), "utf8") !== readFileSync(join(VENDORED, file), "utf8")) {
    differences.push(`content differs: ${file}`);
  }
}
for (const file of vendoredFiles) {
  if (!sourceFiles.includes(file)) {
    differences.push(`stale (not in package): ${relative(".", join(VENDORED, file))}`);
  }
}

if (differences.length > 0) {
  console.error("Vendored fallow skill is out of sync with the installed `fallow` package:");
  for (const line of differences) console.error(`  - ${line}`);
  console.error(`\nFix: ${FIX}`);
  process.exit(1);
}

console.log(`Vendored fallow skill is in sync with ${SOURCE} (${sourceFiles.length} files).`);
