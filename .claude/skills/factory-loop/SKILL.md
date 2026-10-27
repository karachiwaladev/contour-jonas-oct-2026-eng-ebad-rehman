---
name: factory-loop
description: >-
  Automated GitHub issue "factory line" for a repository. Processes open issues
  end-to-end by TAKING ACTION (creating files, projects, features — not just
  answering): claim with 👀, do the work, verify it, and report. Build/feature
  tickets go through clarify → plan → approval → build (on a branch) →
  browser-verify (chrome-devtools) → screenshots → open a PR → WAIT for manual
  review & approval → only then close. Pure-question tickets are answered and
  closed directly. Changes are committed & pushed automatically by a Stop hook.
  Never takes destructive actions. Use when the user wants to "work through",
  "process", "run a factory loop over", or otherwise handle the issues in a
  GitHub repo. Takes a repo as owner/name or a GitHub URL.
---

# Factory Loop

An assembly line for GitHub issues. Each open issue runs through the same
stations. The path depends on the ticket type:

- **Pure question** → claim → research → answer → close.
- **Build / feature / file / project** → claim → clarify → plan → **approval** →
  build (on a branch) → verify in browser → screenshots → **open a PR** → **wait
  for manual review & approval** → close.

**Core principle: take action, don't just answer.** If a ticket asks for a file,
a project, a feature, or a change, *build it* — don't merely describe it.

## Inputs

- **Repo** (required): `owner/name` or a GitHub URL. Parse a URL down to `owner/name`.
- **Filter** (optional): label, assignee, or issue-number range. Default: all open issues.
- **Interval** (optional): to keep running, drive it with `/loop` (see "On a loop").

## Preflight: authentication

Writes (reactions, comments, PRs, close) need an authenticated `gh`; reading a
public repo does not.

1. `gh auth status`. If not logged in, ask the user to run `! gh auth login`.
2. **EMU gotcha** — a `403: As an Enterprise Managed User, you cannot access this
   content` means the logged-in account is a corporate EMU sandboxed to its own
   enterprise and cannot write to outside repos. Ask the user to log in with a
   **personal** account that has access, and retry.
3. First-time git push may hang on the `manager` credential helper. Run
   `gh auth setup-git` once so git uses the `gh` token non-interactively.

## The line (per issue)

### 0. Fetch the work queue

```bash
gh issue list --repo <owner>/<name> --state open --limit 100
```
Public-repo fallback if `gh` can't read: `curl -s ".../issues?state=open&per_page=100"`,
ignoring any item with a `pull_request` key.

**Skip issues already carrying your 👀** — EXCEPT a 👀-claimed issue that is open
and **not yet waiting on a human**: i.e. it has no posted plan awaiting approval
and no open PR awaiting review. Such an issue was claimed but interrupted mid-work
— *finish* it. A claimed issue that already has a pending plan or an open PR is
**awaiting you** → skip it (don't re-do or close it).

### 1. Claim it — 👀 react

```bash
gh api --method POST repos/<owner>/<name>/issues/<n>/reactions \
  -H "Accept: application/vnd.github+json" -f content=eyes
```

### 2. Classify

- **Pure question** → research, **comment** the answer, **close**. Done.
- **Build / feature / file / project** → run the **Build workflow** below.

## Build workflow (build / feature tickets)

One project per folder, per the repo's root `CLAUDE.md`; register new projects in
that index and keep it under 100 lines.

1. **Clarify.** Ask questions to surface and confirm assumptions before building.
2. **Plan.** Propose a concise plan of what you'll build and how.
3. **Get approval.** Do **not** start building until the plan is approved.
4. **Branch.** Create and check out a feature branch, e.g.
   `git checkout -b ticket-<n>-<slug>`. All build work happens here, never
   directly on `main` (the Stop hook then auto-pushes *this* branch).
5. **Build.** Implement it. Extend existing projects non-destructively; migrate
   data forward (preserve old data) rather than wiping it.
6. **Browser-verify with chrome-devtools.** Open the running app/feature (dev
   server or served locally), exercise the new behavior, and confirm it works.
7. **Screenshots.** Save screenshot(s) into the repo (e.g.
   `<project>/screenshots/ticket-<n>-*.png`).
8. **Run evals.** After **every build**, run `node evals/run-all.js` — this runs
   `unit-tests`, `merge-risk`, `verified`, and `edge-cases` and writes each
   `evals/<name>/results.json`. **Commit those results.json files.** See "Evals".
9. **Open a PR.** `gh pr create --base main --head ticket-<n>-<slug>` with a body
   that summarizes the work, embeds the screenshots (raw URLs), **reports the
   unit-tests and merge-risk scores (and the QA eval scores)**, and includes
   `Closes #<n>` so the merge auto-closes the ticket. Then **comment on the issue
   linking the PR and reporting the eval scores**.
10. **WAIT for manual review & approval.** Do **not** merge and do **not** close
   the ticket yourself. The human reviews, approves, and merges the PR; the merge
   (via `Closes #<n>`) closes the ticket. Until then the issue stays open &
   claimed, and later loop runs skip it (awaiting review).

### Attended vs unattended

The loop often runs unattended on a cron, where no one can answer questions or
approve. So:

- **Unattended (cron/loop firing):** for a build ticket, **pause for approval** —
  claim it (👀), post the clarifying questions **and** the proposed plan as an
  issue comment, and **stop there**. Do not build. Next run: if the user approved
  in the thread, proceed through build → verify → screenshots → **open PR** →
  stop (awaiting review); otherwise skip (still awaiting). Never close without an
  approved, merged PR.
- **Attended (user invoked `/factory-loop` and is present):** get plan approval in
  the live session, build straight through, open the PR, then hand off for review.

Pure-question tickets never need approval or a PR — answer and close in either mode.

## Commit & push

Committing and pushing is **automatic** — a `Stop` hook commits all changes and
pushes the **current branch** on every stop. So for build work, create the feature
branch *first* (step 4) and the hook will push it; you don't run `git commit`/
`git push` yourself. `main` is only updated by **merging an approved PR**, never
by a direct push of ticket work. Embedded screenshot links resolve once the
branch push completes.

## Evals

The repo ships evals under `evals/<name>/`, each writing its last run to
`evals/<name>/results.json` in the shape `{"score": 0.83, "cases":[{"id":"…","pass":true}]}`.

- **Engineering:** `unit-tests` (did the build include unit tests?) and
  `merge-risk` (how risky is the PR to merge?).
- **QA:** `verified` (did we actually browser-verify with evidence?) and
  `edge-cases` (does our test-generator find the important edge cases? — its
  golden set lives in `evals/edge-cases/golden.json`).

**After every build:** run `node evals/run-all.js`, **commit all four
`results.json`**, and **report the `unit-tests` and `merge-risk` scores (plus the
QA scores)** in the ticket reply and PR body. Each eval keeps ≥5 cases with at
least one pass and one fail so the score stays meaningful.

## Guardrails — never destructive

- **No destruction.** Never delete or overwrite files/projects you didn't create
  without explicit approval; never `reset --hard`, force-push, rebase, rewrite
  history, or delete branches/tags/issues. Only additive git ops.
- **No self-approval / self-merge.** Do not merge PRs or close build tickets
  yourself — a human reviews, approves, and merges.
- **Extend, don't clobber.** Enhancing a project means adding to it and migrating
  data forward, not replacing working code or wiping stored data.
- **Confirm before bulk writes.** Reacting is cheap; mass comment/PR is not.
  Summarize across N issues and get a go-ahead unless told "process everything".
- **Idempotency.** Re-list before acting so you don't double-process an issue, and
  check for an existing plan/PR before re-doing work.
- **Report faithfully.** List each issue and what happened (claimed / built /
  verified / PR-opened / paused-for-approval / awaiting-review / answered /
  closed / skipped-and-why) with URLs.
- **Right account.** Use a GitHub account with write access to the target repo.

## On a loop

```
/loop 10m run factory-loop over <owner>/<name>
```
Each firing re-fetches open issues and runs the line on anything new — pausing
build tickets for plan approval, and leaving opened PRs for human review. Stop
with CronDelete (the loop reports the job ID) or by telling Claude to "stop the
loop".
