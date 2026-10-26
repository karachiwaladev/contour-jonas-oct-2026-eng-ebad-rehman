#!/usr/bin/env node
// Stop hook: append new user prompts from the current session to a per-session
// JSONL log. Runs each time Claude stops.
//
// Input : the Stop hook payload on stdin (JSON) -> { session_id, transcript_path, ... }
// Output: <repo>/.claude/session-prompts/<session_id>.jsonl (git-ignored), one
//         prompt per line: { "ts", "session_id", "uuid", "prompt" }
//
// "Prompt" = a user-role transcript entry that is NOT injected meta (skips cron /
// skill-expansion entries) and NOT a tool result. Dedup is by entry uuid, so each
// Stop only appends prompts not already written. Failures never disrupt the stop.

const fs = require("fs");
const path = require("path");

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); } catch (e) { return ""; }
}

function extractPrompt(e) {
  if (!e || e.type !== "user" || !e.message) return null;
  if (e.isMeta) return null;                                      // injected/system meta, not user-typed
  const c = e.message.content;
  if (typeof c === "string") return c;                           // typed message or slash command
  if (Array.isArray(c)) {
    if (c.some(x => x && x.type === "tool_result")) return null; // tool result, not a prompt
    const texts = c.filter(x => x && x.type === "text").map(x => x.text);
    if (texts.length) return texts.join("\n");
  }
  return null;
}

try {
  const input = JSON.parse(readStdin() || "{}");
  const transcriptPath = input.transcript_path;
  const sessionId = input.session_id || "unknown-session";
  if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0);

  // repo-local output: this script lives in <repo>/.claude/hooks/
  const outDir = path.join(__dirname, "..", "session-prompts");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, sessionId + ".jsonl");

  const seen = new Set();
  if (fs.existsSync(outFile)) {
    for (const line of fs.readFileSync(outFile, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); if (o.uuid) seen.add(o.uuid); } catch (e) {}
    }
  }

  const out = [];
  for (const line of fs.readFileSync(transcriptPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch (err) { continue; }
    const prompt = extractPrompt(e);
    if (prompt == null) continue;
    const uuid = e.uuid || ((e.timestamp || "") + ":" + prompt.slice(0, 40));
    if (seen.has(uuid)) continue;
    seen.add(uuid);
    out.push(JSON.stringify({ ts: e.timestamp || null, session_id: sessionId, uuid, prompt }));
  }

  if (out.length) fs.appendFileSync(outFile, out.join("\n") + "\n");
} catch (err) {
  // swallow — a logging hook must never block Claude from stopping
}
process.exit(0);
