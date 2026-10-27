#!/usr/bin/env node
// Eval: "what is the merge risk of an open PR?"
// A heuristic scores each PR's signals into low/medium/high risk. Each case
// passes when the computed level matches the expected label. Score = accuracy.
// Writes evals/merge-risk/results.json: { score, cases:[{id, pass}] }.
const fs = require("fs"), path = require("path");

function riskLevel(s) {
  let p = 0;
  if (s.lines > 300) p += 2; else if (s.lines > 100) p += 1;
  if (s.files > 10) p += 1;
  if (!s.hasTests) p += 1;
  if (s.touchesConfig) p += 2;
  if (s.destructive) p += 3;
  return p >= 4 ? "high" : p >= 2 ? "medium" : "low";
}

const cases = [
  { id: "docs-typo",          s: { lines: 8,   files: 1,  hasTests: false, touchesConfig: false, destructive: false }, expected: "low" },
  { id: "todo-feature",       s: { lines: 130, files: 2,  hasTests: false, touchesConfig: false, destructive: false }, expected: "medium" },
  { id: "big-refactor",       s: { lines: 520, files: 15, hasTests: false, touchesConfig: false, destructive: false }, expected: "high" },
  { id: "delete-module",      s: { lines: 40,  files: 2,  hasTests: false, touchesConfig: false, destructive: true  }, expected: "high" },
  { id: "config-change",      s: { lines: 20,  files: 1,  hasTests: false, touchesConfig: true,  destructive: false }, expected: "medium" },
  // adversarial: a tiny, well-tested but security-sensitive change the heuristic under-rates -> FAIL
  { id: "subtle-auth-change", s: { lines: 15,  files: 1,  hasTests: true,  touchesConfig: false, destructive: false }, expected: "high" },
];

const rows = cases.map(c => {
  const computed = riskLevel(c.s);
  return { id: c.id, pass: computed === c.expected, expected: c.expected, computed };
});
const score = +(rows.filter(r => r.pass).length / rows.length).toFixed(3);
const out = { eval: "merge-risk", score, total: rows.length, passed: rows.filter(r=>r.pass).length, cases: rows };
fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log("merge-risk score:", score, `(${out.passed}/${out.total})`);
