#!/usr/bin/env node
// i18n key-extraction / coverage / stale-check CLI (issue #975). See .claude/skills/i18n/SKILL.md
// for the full workflow. `ja.json` is owner-authored: these commands only ever add/remove KEYS
// with English-placeholder values — they never write a Japanese value.
import { collectKeys, findStale, reportStatus, syncCatalog } from "./lib/i18nKeys.mjs";

const [, , subcommand, ...rest] = process.argv;
const flags = new Set(rest);

function printWarnings(warnings) {
  if (warnings.length === 0) return;
  console.log(`\n${warnings.length} warning(s) — not statically extractable, review by hand:`);
  for (const w of warnings) {
    if (w.type === "template-literal") {
      console.log(`  - ${w.file}:${w.line} — template literal in t() (forbidden; use {{var}} interpolation instead)`);
    }
    else {
      console.log(`  - ${w.file}:${w.line} — dynamic key: ${w.snippet}`);
    }
  }
}

function runExtract() {
  const {
    keys, warnings,
  } = collectKeys();
  const {
    added, total,
  } = syncCatalog({
    keys,
  });
  console.log(`Added ${added.length} new key(s), ${total} total key(s) in ja.json.`);
  if (added.length > 0) {
    for (const key of added) console.log(`  + ${key}`);
  }
  printWarnings(warnings);
  process.exit(0);
}

function runStatus() {
  const {
    keys, warnings,
  } = collectKeys();
  const {
    translated, untranslated, orphaned,
  } = reportStatus({
    keys,
  });
  const total = translated + untranslated.length + orphaned.length;
  console.log(`i18n coverage: ${translated}/${total} translated (${untranslated.length} untranslated, ${orphaned.length} orphaned).`);

  if (untranslated.length > 0) {
    console.log("\nUntranslated, grouped by source directory:");
    const byDir = new Map();
    for (const {
      key, dirs,
    } of untranslated) {
      const [primary, ...rest] = dirs;
      const suffix = rest.length > 0 ? ` (+${rest.length} other location(s))` : "";
      if (!byDir.has(primary)) byDir.set(primary, []);
      byDir.get(primary).push(`${key}${suffix}`);
    }
    for (const dir of [...byDir.keys()].sort()) {
      console.log(`  ${dir}:`);
      for (const line of byDir.get(dir)) console.log(`    - ${line}`);
    }
  }

  if (orphaned.length > 0) {
    console.log("\nOrphaned (no current source reference — run `pnpm i18n:check-stale` for details):");
    for (const key of orphaned) console.log(`  - ${key}`);
  }

  printWarnings(warnings);
  process.exit(0);
}

function runCheckStale() {
  const {
    keys,
  } = collectKeys();
  const {
    untranslatedStale, translatedStale,
  } = findStale({
    keys,
  });

  if (untranslatedStale.length === 0 && translatedStale.length === 0) {
    console.log("No stale keys — every ja.json key is still referenced by a t() call.");
    process.exit(0);
  }

  if (untranslatedStale.length > 0) {
    console.log(`${untranslatedStale.length} stale untranslated key(s) — safe to remove:`);
    for (const key of untranslatedStale) console.log(`  - ${key}`);
  }

  if (translatedStale.length > 0) {
    console.log(`\n⚠ ${translatedStale.length} stale TRANSLATED key(s) — no longer referenced by any t() call, but carry a translation. Confirm the phrase was renamed (and carry the translation forward) before deleting these:`);
    for (const {
      key, value,
    } of translatedStale) console.log(`  - "${key}" → "${value}"`);
  }

  const shouldFail = flags.has("--fail-on-stale") && (untranslatedStale.length > 0 || translatedStale.length > 0);
  process.exit(shouldFail ? 1 : 0);
}

switch (subcommand) {
  case "extract":
    runExtract();
    break;
  case "status":
    runStatus();
    break;
  case "check-stale":
    runCheckStale();
    break;
  default:
    console.error("Usage: node scripts/i18n.mjs <extract|status|check-stale> [--fail-on-stale]");
    process.exit(1);
}
