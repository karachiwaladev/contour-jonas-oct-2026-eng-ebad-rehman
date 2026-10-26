#!/usr/bin/env node
// Stop hook: auto-commit & push pending changes on every stop.
//
// Non-destructive by design: only `git add -A` + commit + push of the CURRENT
// branch. Never resets, force-pushes, rebases, deletes, or rewrites history.
// Never throws — a failure here must not block Claude from stopping.
//
// The session cwd may not itself be a git repo (e.g. a parent folder holding
// project repos), so this checks the cwd AND its immediate subdirectories and
// acts on every git repo that (a) has changes and (b) has an `origin` remote.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function git(args, cwd, extraEnv) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...(extraEnv || {}) },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function readStdin() { try { return fs.readFileSync(0, "utf8"); } catch (e) { return ""; } }

try {
  const input = JSON.parse(readStdin() || "{}");
  const base = input.cwd || process.cwd();

  const candidates = [base];
  try {
    for (const d of fs.readdirSync(base, { withFileTypes: true })) {
      if (d.isDirectory() && !d.name.startsWith(".")) candidates.push(path.join(base, d.name));
    }
  } catch (e) {}

  // resolve to unique git repo toplevels
  const repos = new Set();
  for (const dir of candidates) {
    try { const top = git(["rev-parse", "--show-toplevel"], dir); if (top) repos.add(top); } catch (e) {}
  }

  for (const repo of repos) {
    try {
      if (!git(["status", "--porcelain"], repo)) continue;       // nothing to commit
      let hasOrigin = true;
      try { git(["remote", "get-url", "origin"], repo); } catch (e) { hasOrigin = false; }

      const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], repo);
      git(["add", "-A"], repo);
      const msg = "chore: factory-loop auto-commit " + new Date().toISOString();
      try {
        git(["-c", "user.name=Ebad-Ur-Rehman-21",
             "-c", "user.email=ebad.rehman@jonasclub.com",
             "commit", "-m", msg], repo);
      } catch (e) { continue; } // nothing actually staged / commit failed

      if (hasOrigin) {
        try { git(["push", "origin", branch], repo, { GIT_TERMINAL_PROMPT: "0" }); } catch (e) {}
      }
    } catch (e) {}
  }
} catch (e) {
  // swallow — never block the stop
}
process.exit(0);
