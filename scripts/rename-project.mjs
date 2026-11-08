#!/usr/bin/env node
// One-shot project rename for a fresh copy of this starter.
//
//   pnpm rename <project-name> [--scope <scope>] [--title "Display Name"]
//
// Rewrites, across every tracked text file:
//   - the npm scope `@app/` → `@<scope>/` (default: the project name),
//   - the root package name `app-core` → <project-name>,
//   - the default database / bucket name `app` in connection strings and S3 defaults,
//   - the UI/PWA display name "App" in index.html + the PWA manifest + the sidebar header.
// Then run `pnpm install` to refresh the lockfile. Safe to run once; re-running is a no-op.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const name = args.find(arg => !arg.startsWith("--"));
const flag = (key) => {
  const i = args.indexOf(`--${key}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  console.error("Usage: pnpm rename <project-name> [--scope <scope>] [--title \"Display Name\"]");
  console.error("  <project-name> must be lowercase letters, digits, and hyphens.");
  process.exit(1);
}
const scope = flag("scope") ?? name;
const title = flag("title") ?? name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const files = execSync("git ls-files", {
  encoding: "utf8",
}).split("\n").filter(file =>
  file
  && !file.startsWith(".claude/skills/fallow/")
  && file !== "pnpm-lock.yaml"
  && !/\.(png|jpe?g|ico|webp|gif|woff2?)$/.test(file));

/** [pattern, replacement, onlyIn?] */
const rules = [
  [/@app\//g, `@${scope}/`],
  [/"app-core"/g, `"${name}"`],
  [/localhost:5432\/app\b/g, `localhost:5432/${name}`],
  [/POSTGRES_DB:-app\}/g, `POSTGRES_DB:-${name}}`],
  [/S3_BUCKET:-app\}/g, `S3_BUCKET:-${name}}`],
  [/S3_BUCKET=app$/gm, `S3_BUCKET=${name}`],
  [/S3_BUCKET \?\? "app"/g, `S3_BUCKET ?? "${name}"`],
  [/<title>App<\/title>/g, `<title>${title}</title>`, "packages/client/index.html"],
  [/name: "App",\n(\s+)short_name: "App",/g, `name: "${title}",\n$1short_name: "${title}",`, "packages/client/vite.config.ts"],
  [/\{t\("App"\)\}/g, `{t("${title}")}`, "packages/client/src/components/AppSidebar.tsx"],
];

let changed = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  }
  catch {
    continue;
  }
  let next = text;
  for (const [pattern, replacement, onlyIn] of rules) {
    if (onlyIn && onlyIn !== file) continue;
    next = next.replace(pattern, replacement);
  }
  if (next !== text) {
    writeFileSync(file, next);
    changed += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`\nRenamed to "${name}" (scope @${scope}, title "${title}") in ${changed} files.`);
console.log("Next: pnpm install && pnpm --filter=@" + scope + "/client routeTree && pnpm typecheck");
