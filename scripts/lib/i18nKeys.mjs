// Shared engine for the i18n key-extraction/sync/coverage/stale-check tooling (issue #975).
// Pure functions only — no process.exit, no console output. The CLI layer (scripts/i18n.mjs)
// owns all printing and exit codes.
//
// `ja.json` is owner-authored: this module may add/remove KEYS with English-placeholder values,
// but must never write or overwrite a translated value.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

export const CLIENT_SRC = join(REPO_ROOT, "packages", "client", "src");
export const JA_JSON = join(CLIENT_SRC, "locales", "ja.json");

const EXCLUDE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.stories\.tsx$/,
  /^i18n\.ts$/,
  /^routeTree\.gen\.ts$/,
  /^locales\//,
];

function isExcluded(relPath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(relPath));
}

/** Recursively list `.ts`/`.tsx` files under `dir`, as paths relative to `dir`. */
function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      out.push(...listSourceFiles(abs).map(child => join(entry, child)));
    }
    else if (/\.tsx?$/.test(entry)) {
      out.push(entry);
    }
  }
  return out;
}

function isTCallee(expr) {
  return ts.isIdentifier(expr) && expr.text === "t";
}

function isI18nTCallee(expr) {
  return (
    ts.isPropertyAccessExpression(expr)
    && ts.isIdentifier(expr.expression)
    && expr.expression.text === "i18n"
    && expr.name.text === "t"
  );
}

/**
 * Walk every non-excluded `.ts`/`.tsx` file under CLIENT_SRC looking for `t("...")` /
 * `i18n.t("...")` calls with a statically-known string first argument.
 *
 * Returns `{ keys: Map<string, Set<string>>, warnings: Array<{type, file, line, snippet?}> }`
 * where `keys` maps each extracted key to the set of relative file paths that reference it.
 */
export function collectKeys() {
  const relFiles = listSourceFiles(CLIENT_SRC).filter(f => !isExcluded(f));
  const keys = new Map();
  const warnings = [];

  for (const relFile of relFiles) {
    const absFile = join(CLIENT_SRC, relFile);
    const text = readFileSync(absFile, "utf8");
    const scriptKind = relFile.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(absFile, text, ts.ScriptTarget.Latest, true, scriptKind);

    const visit = (node) => {
      if (ts.isCallExpression(node) && (isTCallee(node.expression) || isI18nTCallee(node.expression))) {
        const arg = node.arguments[0];
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
          const key = arg.text;
          if (!keys.has(key)) keys.set(key, new Set());
          keys.get(key).add(relFile);
        }
        else if (arg && ts.isTemplateExpression(arg)) {
          warnings.push({
            type: "template-literal",
            file: relFile,
            line,
          });
        }
        else if (arg) {
          warnings.push({
            type: "dynamic-key",
            file: relFile,
            line,
            snippet: arg.getText(sourceFile),
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return {
    keys,
    warnings,
  };
}

function readCatalogRaw() {
  return existsSync(JA_JSON) ? readFileSync(JA_JSON, "utf8") : "";
}

function readCatalog() {
  const raw = readCatalogRaw();
  return raw ? JSON.parse(raw) : {};
}

function sortCatalog(catalog) {
  // Plain codepoint comparison, not localeCompare: locale collation can treat different keys as
  // equal-weight (punctuation-heavy keys like "{{count}} Column" vs "AI summarization..."), and
  // Array.sort only guarantees stability for ties by *original* array order — which differs run to
  // run — so localeCompare can silently reorder the file on a no-op re-sort. Ordinal comparison is
  // a strict total order, so the output is deterministic regardless of input order.
  return Object.fromEntries(
    Object.entries(catalog).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

function serializeCatalog(catalog) {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

/**
 * Add any key in `keys` missing from `ja.json` with an English-placeholder value (`key: key`).
 * Never touches an existing key's value. Re-sorts and writes only if content actually changed.
 *
 * Returns `{ added: string[], total: number }`.
 */
export function syncCatalog({
  keys,
}) {
  const before = readCatalogRaw();
  const catalog = before ? JSON.parse(before) : {};
  const added = [];

  for (const key of keys.keys()) {
    if (!(key in catalog)) {
      catalog[key] = key;
      added.push(key);
    }
  }

  const sorted = sortCatalog(catalog);
  const after = serializeCatalog(sorted);
  // Compare against the raw on-disk text (not a recomputed value from the same in-memory
  // catalog) so an out-of-order or differently-formatted file on disk still gets rewritten even
  // when zero keys were added — otherwise a 0-added run always short-circuits as a "no-op" and
  // never actually re-sorts/reformats the file.
  if (after !== before) {
    writeFileSync(JA_JSON, after);
  }

  return {
    added,
    total: Object.keys(sorted).length,
  };
}

/**
 * Report translated/untranslated coverage from the current catalog + a fresh `collectKeys()`.
 * Returns `{ translated: number, untranslated: [{key, dirs}], orphaned: string[] }` where
 * `untranslated` is grouped by the first 1-2 path segments of a referencing file.
 */
export function reportStatus({
  keys,
}) {
  const catalog = readCatalog();
  let translated = 0;
  const untranslated = [];
  const orphaned = [];

  for (const [key, value] of Object.entries(catalog)) {
    if (value !== key) {
      translated++;
      continue;
    }
    const files = keys.get(key);
    if (!files || files.size === 0) {
      orphaned.push(key);
      continue;
    }
    const dirs = new Set([...files].map(f => f.split("/").slice(0, 2).join("/")));
    untranslated.push({
      key,
      dirs: [...dirs].sort(),
    });
  }

  return {
    translated,
    untranslated,
    orphaned,
  };
}

/**
 * Keys present in `ja.json` but no longer referenced by any current `t()`/`i18n.t()` call.
 * Split into `untranslatedStale` (value === key, safe to remove) and `translatedStale`
 * (value !== key — carries a translation; warn loudly before deleting).
 */
export function findStale({
  keys,
}) {
  const catalog = readCatalog();
  const untranslatedStale = [];
  const translatedStale = [];

  for (const [key, value] of Object.entries(catalog)) {
    if (keys.has(key)) continue;
    if (value === key) untranslatedStale.push(key);
    else translatedStale.push({
      key,
      value,
    });
  }

  return {
    untranslatedStale,
    translatedStale,
  };
}
