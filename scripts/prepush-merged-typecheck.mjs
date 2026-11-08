#!/usr/bin/env node
// Pre-push gate that reproduces what CI checks but local `pnpm typecheck` does not: the typecheck
// of the *merged* result. GitHub Actions typechecks the branch merged with the latest `main`, so a
// type change that is fine on the branch alone can still break once `main` has moved on (e.g. a new
// file on `main` references a field this branch removed). That class of failure is invisible to a
// branch-only `pnpm typecheck` and only surfaces after a full CI run. This hook trial-merges the
// current `origin/main` into the working tree, runs `pnpm typecheck`, then restores the tree —
// catching the drift in under a minute, before the push.
//
// It is deliberately conservative: it never blocks on anything other than a genuine typecheck
// failure of the merged tree. Offline, a dirty tree, a missing base, an already-merged branch, or a
// merge conflict each just print a notice and let the push through (CI remains the backstop). Set
// SKIP_MERGED_TYPECHECK=1 to bypass entirely.
import { execFileSync, spawnSync } from "node:child_process";

const BASE = "main";

/** Run a git command, returning trimmed stdout; throws on non-zero exit. */
function git(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
  }).trim();
}

/** Run a git command, returning { ok, stdout, stderr } without throwing. */
function tryGit(...args) {
  const res = spawnSync("git", args, {
    encoding: "utf8",
  });
  return {
    ok: res.status === 0,
    stdout: (res.stdout ?? "").trim(),
    stderr: (res.stderr ?? "").trim(),
  };
}

function skip(reason) {
  console.log(`[pre-push] merged-result typecheck skipped: ${reason}`);
  process.exit(0);
}

if (process.env.SKIP_MERGED_TYPECHECK === "1") skip("SKIP_MERGED_TYPECHECK=1");

const branch = tryGit("rev-parse", "--abbrev-ref", "HEAD").stdout;
if (!branch || branch === "HEAD") skip("not on a branch (detached HEAD)");
if (branch === BASE || branch === "master") skip(`pushing ${branch} itself`);

// A trial merge needs a clean tree so it can be cleanly undone afterwards.
if (tryGit("status", "--porcelain").stdout !== "") skip("working tree has uncommitted changes");

// Refresh the base. Offline / no remote → let the push proceed; CI still checks.
if (!tryGit("fetch", "origin", BASE).ok) skip(`could not fetch origin/${BASE} (offline?)`);

const baseRef = `origin/${BASE}`;
if (!tryGit("rev-parse", "--verify", baseRef).ok) skip(`${baseRef} not found`);

// Nothing new to catch if the branch already contains the latest base.
if (tryGit("merge-base", "--is-ancestor", baseRef, "HEAD").ok) {
  skip(`branch already up to date with ${baseRef}`);
}

const startHead = git("rev-parse", "HEAD");

/** Best-effort restore of the working tree to the pre-merge state. */
function restore() {
  // Abort an in-progress merge if one is still open, then hard-reset to where we started.
  spawnSync("git", ["merge", "--abort"], {
    stdio: "ignore",
  });
  spawnSync("git", ["reset", "--hard", startHead], {
    stdio: "ignore",
  });
}

let failed = false;
try {
  const merge = tryGit("merge", "--no-commit", "--no-ff", baseRef);
  if (!merge.ok) {
    // A conflict here will also need resolving before the PR can merge, but that is a separate
    // signal from a type error — surface it and let the push through rather than blocking.
    restore();
    skip(`${baseRef} does not merge cleanly (resolve before opening/updating the PR)`);
  }

  console.log(`[pre-push] typechecking ${branch} merged with ${baseRef}…`);
  const typecheck = spawnSync("pnpm", ["typecheck"], {
    stdio: "inherit",
  });
  failed = typecheck.status !== 0;
}
finally {
  restore();
}

if (failed) {
  console.error(
    `\n[pre-push] typecheck FAILED against ${branch} merged with ${baseRef}.\n`
    + "This is what CI checks. Merge or rebase onto the latest main, fix the type errors, then push.\n"
    + "(To bypass this gate for one push: SKIP_MERGED_TYPECHECK=1 git push)",
  );
  process.exit(1);
}

console.log("[pre-push] merged-result typecheck passed.");
