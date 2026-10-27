#!/usr/bin/env node
// PreToolUse hook: hard-block dangerous operations regardless of permission rules.
// Blocks: rm -rf, git push --force, curl|sh / wget|sh, and reading .env files.
// Returns a PreToolUse "deny" decision when a rule matches; otherwise allows.
const fs = require("fs");
function readStdin() { try { return fs.readFileSync(0, "utf8"); } catch (e) { return ""; } }
function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  }));
  process.exit(0);
}

try {
  const input = JSON.parse(readStdin() || "{}");
  const tool = input.tool_name;
  const ti = input.tool_input || {};

  if (tool === "Bash") {
    const cmd = String(ti.command || "");
    const RULES = [
      [/\brm\s+-\S*r\S*f|\brm\s+-\S*f\S*r|\brm\s+--recursive\b[\s\S]*--force|\brm\s+--force\b[\s\S]*--recursive/i,
        "rm -rf is blocked (destructive recursive delete)"],
      [/\bgit\s+push\b[\s\S]*(--force\b|\s-f\b|--force-with-lease\b)/i,
        "git push --force is blocked (history rewrite)"],
      [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh|dash)\b/i,
        "piping a download into a shell (curl|sh) is blocked"],
      [/(^|\s|["'`=<(/\\])\.env(\.[\w-]+)?\b/i,
        "reading/handling .env files is blocked (secrets)"],
    ];
    for (const [re, msg] of RULES) {
      if (re.test(cmd)) deny(msg + " — command: " + cmd.slice(0, 160));
    }
  }

  if (tool === "Read" || tool === "Edit" || tool === "Write") {
    const fp = String(ti.file_path || "");
    if (/(^|[/\\])\.env(\.[\w-]+)?$/i.test(fp)) deny("Accessing .env files is blocked (secrets): " + fp);
  }
} catch (e) { /* fail open on parse errors — never wedge the agent */ }
process.exit(0);
