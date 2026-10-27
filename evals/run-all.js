#!/usr/bin/env node
// Run every eval and print a summary. Each eval writes its own results.json.
const { execFileSync } = require("child_process");
const path = require("path");
const EVALS = ["unit-tests", "merge-risk", "verified", "edge-cases"];
for (const name of EVALS) {
  execFileSync("node", [path.join(__dirname, name, "run.js")], { stdio: "inherit" });
}
