#!/usr/bin/env node
// Eval: "did the agent actually verify the feature (browser run + evidence)?"
// A detector scans a ticket/PR reply for a verification claim AND screenshot
// evidence. Each case passes when the detector matches the ground-truth label.
// Writes evals/verified/results.json: { score, cases:[{id, pass}] }.
const fs = require("fs"), path = require("path");

const CLAIM_RE = /(verified in (the )?browser|browser-verif|chrome-devtools|playwright|manually tested)/i;
const EVIDENCE_RE = /screenshot|\.png\b/i;
const verified = (text) => CLAIM_RE.test(text) && EVIDENCE_RE.test(text);

const cases = [
  { id: "full-verify",       expected: true,  text: "Verified in the browser via Playwright; screenshot ticket-4-overview.png attached." },
  { id: "pushed-no-verify",  expected: false, text: "Implemented and pushed to main." },
  { id: "devtools-shot",     expected: true,  text: "Ran chrome-devtools and confirmed; see overview.png." },
  { id: "tests-only",        expected: false, text: "Added unit tests, all green." },
  { id: "claim-no-evidence", expected: false, text: "Verified in the browser." },
  // adversarial: genuine verification but evidence is a gif, which the detector misses -> FAIL
  { id: "gif-evidence",      expected: true,  text: "QA sign-off: manually tested in Chrome, attached recording.gif." },
];

const rows = cases.map(c => {
  const detected = verified(c.text);
  return { id: c.id, pass: detected === c.expected, expected: c.expected, detected };
});
const score = +(rows.filter(r => r.pass).length / rows.length).toFixed(3);
const out = { eval: "verified", score, total: rows.length, passed: rows.filter(r=>r.pass).length, cases: rows };
fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log("verified score:", score, `(${out.passed}/${out.total})`);
