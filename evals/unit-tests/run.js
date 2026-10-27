#!/usr/bin/env node
// Eval: "did the agent write unit tests for this deliverable?"
// A detector scans code for unit-test patterns. Each case passes when the
// detector's verdict matches the ground-truth label. Score = accuracy.
// Writes evals/unit-tests/results.json: { score, cases:[{id, pass}] }.
const fs = require("fs"), path = require("path");

const TEST_RE = /\b(describe|it|test)\s*\(|\bexpect\s*\(|\bassert\b|def\s+test_/;
const detect = (code) => TEST_RE.test(code);

const cases = [
  { id: "jest-suite",            expected: true,  code: "describe('sum',()=>{it('adds',()=>{expect(sum(1,2)).toBe(3)})})" },
  { id: "node-assert",           expected: true,  code: "const assert=require('assert');assert.equal(add(1,2),3);" },
  { id: "pytest",                expected: true,  code: "def test_add():\n    assert add(1,2)==3" },
  { id: "impl-only",             expected: false, code: "function add(a,b){return a+b;}" },
  { id: "todo-snippet-no-tests", expected: false, code: "const db={toggle(id){/* flips done */}};" },
  // adversarial: these ARE tests (custom helper) but the detector misses them -> FAIL
  { id: "custom-assert-helper",  expected: true,  code: "function check(c,m){if(!c)throw Error(m)}; check(add(1,2)===3,'add');" },
];

const rows = cases.map(c => {
  const detected = detect(c.code);
  return { id: c.id, pass: detected === c.expected, expected: c.expected, detected };
});
const score = +(rows.filter(r => r.pass).length / rows.length).toFixed(3);
const out = { eval: "unit-tests", score, total: rows.length, passed: rows.filter(r=>r.pass).length, cases: rows };
fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log("unit-tests score:", score, `(${out.passed}/${out.total})`);
