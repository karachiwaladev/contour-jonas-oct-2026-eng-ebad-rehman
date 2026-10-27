#!/usr/bin/env node
// Eval: "does the test-generator find the important edge cases?"
// For each feature, a (simulated) generator proposes edge cases; we measure
// recall against the golden set in golden.json. A case passes when recall >= 0.5.
// Writes evals/edge-cases/results.json: { score, cases:[{id, pass}] }.
const fs = require("fs"), path = require("path");

const golden = JSON.parse(fs.readFileSync(path.join(__dirname, "golden.json"), "utf8")).features;

// what our generator proposed for each feature (stand-in for the real generator output)
const proposed = {
  "due-date":           ["empty", "today", "past date", "far future", "leap day"],
  "tags":               ["empty", "duplicate", "whitespace"],
  "priority":           ["invalid value", "missing", "all same", "mixed"],
  "recurrence":         ["no due date", "complete twice"],
  "filter-combination": ["no matches"],
  "edit":               ["empty text save", "cancel discards", "change all fields"],
};

const THRESHOLD = 0.5;
const rows = Object.keys(golden).map(id => {
  const want = golden[id];
  const got = proposed[id] || [];
  const found = want.filter(e => got.includes(e)).length;
  const recall = +(found / want.length).toFixed(3);
  return { id, pass: recall >= THRESHOLD, recall, found, of: want.length };
});
const score = +(rows.filter(r => r.pass).length / rows.length).toFixed(3);
const out = { eval: "edge-cases", score, threshold: THRESHOLD, total: rows.length, passed: rows.filter(r=>r.pass).length, cases: rows };
fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log("edge-cases score:", score, `(${out.passed}/${out.total})`);
