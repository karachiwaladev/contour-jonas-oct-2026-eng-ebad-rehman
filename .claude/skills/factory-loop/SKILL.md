---
name: factory-loop
description: >-
  Automated GitHub issue "factory line" for a repository. Processes open issues
  end-to-end by TAKING ACTION (creating files, projects, features — not just
  answering): claim with 👀, do the work, verify it, comment the result, then
  close the issue. Build/feature tickets go through clarify → plan → approval →
  build → browser-verify (chrome-devtools) → screenshot-on-ticket. Changes are
  committed & pushed automatically by a Stop hook. Never takes destructive
  actions. Use when the user wants to "work through", "process", "run a factory
  loop over", or otherwise handle the issues in a GitHub repo. Takes a repo as
  owner/name or a GitHub URL.
---

# Factory Loop

An assembly line for GitHub issues. Given a repository, it works each open issue
through the same stations — **claim → do the work → verify → answer → close** —
and can repeat on an interval to catch new ones.

**Core principle: take action, don't just answer.** If a ticket asks for a file,
a project, a feature, or a change, *build it* — don't merely describe it. The
only exception is a ticket that is genuinely a pure question.

## Inputs

- **Repo** (required): `owner/name` or a GitHub URL. Parse a URL down to `owner/name`.
- **Filter** (optional): label, assignee, or issue-number range. Default: all open issues.
- **Interval** (optional): to keep running, drive it with `/loop` (see "On a loop").

## Preflight: authentication

Writes (reactions, comments, close/reopen) need an authenticated `gh`; reading a
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

**Skip issues already carrying your 👀** — EXCEPT a 👀-claimed issue that is still
open and not yet commented/closed: that one was claimed but interrupted, so
*finish* it rather than skip it.

### 1. Claim it — 👀 react

```bash
gh api --method POST repos/<owner>/<name>/issues/<n>/reactions \
  -H "Accept: application/vnd.github+json" -f content=eyes
```

### 2. Do the work — classify first

- **Pure question** → research and answer in the comment (step 4).
- **Build / feature / file / project** → run the **Build workflow** below. One
  project per folder, per the repo's root `CLAUDE.md`; register new projects in
  that index and keep it under 100 lines.

### 3. Verify

For anything with runtime behavior (a web app/page/feature), **verify it in a
real browser with chrome-devtools** before closing — see the Build workflow.
For non-runtime work, sanity-check the output (e.g. simulate core logic).

### 4. Answer — comment the result

```bash
gh issue comment <n> --repo <owner>/<name> --body "<what you did, links, screenshot>"
```
State what was built/changed, link the files, and embed the screenshot (Build
workflow). Multi-line bodies: PowerShell single-quoted here-string, or Bash
`--body @'...'@`.

### 5. Close it

```bash
gh issue close <n> --repo <owner>/<name>
```

## Build workflow (build / feature tickets)

1. **Clarify.** Ask questions to surface and confirm assumptions before building.
2. **Plan.** Propose a concise plan of what you'll build and how.
3. **Get approval.** Do **not** start building until the plan is approved.
4. **Build.** Implement it. Extend existing projects non-destructively; migrate
   data forward (preserve old data) rather than wiping it.
5. **Browser-verify with chrome-devtools.** Open the running app/feature (a local
   `file://` path or dev server), exercise the new behavior, and confirm it works.
6. **Screenshot on the ticket.** Save screenshot(s) into the repo (e.g.
   `<project>/screenshots/ticket-<n>-*.png`) and embed them in the closing
   comment via a raw URL:
   `![ticket-<n>](https://raw.githubusercontent.com/<owner>/<name>/<branch>/<path>.png)`.

### Attended vs unattended

The loop often runs unattended on a cron, where no one can answer questions or
approve a plan. So:

- **Unattended (cron/loop firing):** for a build ticket, **pause for approval** —
  claim it (👀), post the clarifying questions **and** the proposed plan as an
  issue comment, and **stop there**. Do not build, do not close. The ticket stays
  open awaiting the user. Next run: if the user has replied/approved in the
  thread, proceed to build/verify/screenshot/close; otherwise skip (still claimed).
- **Attended (user invoked `/factory-loop` and is present):** ask the questions
  and get plan approval in the live session, then build straight through.

Pure-question tickets never need approval — answer and close in either mode.

## Commit & push

Committing and pushing is **automatic** — a `Stop` hook commits all changes and
pushes the current branch on every stop. So the loop's job is to *create the
files and update the issue*; you do not need to run `git commit`/`git push`
yourself. Consequence: a closing comment should reference `main` generally rather
than a specific commit hash (the push lands when the turn stops), and embedded
screenshot links resolve once that push completes.

## Guardrails — never destructive

- **No destruction.** Never delete or overwrite files/projects you didn't create
  without explicit approval; never `reset --hard`, force-push, rebase, rewrite
  history, or delete branches/tags/issues. Only additive git ops (handled by the
  Stop hook).
- **Extend, don't clobber.** Enhancing a project means adding to it and migrating
  data forward, not replacing working code or wiping stored data.
- **Confirm before bulk writes.** Reacting is cheap; mass comment/close is not.
  Summarize across N issues and get a go-ahead unless told "process everything".
- **Idempotency.** Re-list before acting so you don't double-process an issue.
- **Report faithfully.** List each issue and what happened (claimed / built /
  verified / answered / closed / paused-for-approval / skipped-and-why) with URLs.
- **Right account.** Use a GitHub account with write access to the target repo.

## On a loop

```
/loop 10m run factory-loop over <owner>/<name>
```
Each firing re-fetches open issues and runs the line on anything new, pausing
build tickets for approval as above. Stop with CronDelete (the loop reports the
job ID) or by telling Claude to "stop the loop".
