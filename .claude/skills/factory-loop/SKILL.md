---
name: factory-loop
description: >-
  Automated GitHub issue "factory line" for a repository. Processes open issues
  end-to-end: react 👀 to signal work-in-progress, research/do the requested
  work, post the answer as a comment, then close the issue. Optionally runs on a
  loop to keep picking up new issues. Use when the user wants to "work through",
  "process", "triage and answer", "clear", or "run a factory loop over" the
  issues in a GitHub repo, or asks to handle issues one-by-one automatically.
  Takes a repo as owner/name or a GitHub URL.
---

# Factory Loop

An assembly line for GitHub issues. Given a repository, it works each open issue
through the same stations — **claim → work → answer → close** — and can repeat on
an interval to catch new ones.

## Inputs

- **Repo** (required): `owner/name` or a GitHub URL
  (e.g. `https://github.com/owner/name`). Parse the URL down to `owner/name`.
- **Filter** (optional): label, assignee, or issue number range. Default: all
  open issues.
- **Interval** (optional): if the user wants it to keep running (e.g. "every
  10 min"), drive it with the `/loop` skill — see "Running on a loop" below.

## Preflight: authentication

Writing to issues (reactions, comments, close/reopen) requires an authenticated
`gh`. Reading a **public** repo does not.

1. Check access: `gh auth status`. If not logged in, ask the user to run
   `! gh auth login` (GitHub.com → HTTPS → login with browser).
2. **Enterprise Managed User (EMU) gotcha** — if a write returns
   `403: As an Enterprise Managed User, you cannot access this content`, the
   logged-in account is a corporate EMU identity sandboxed to its own
   enterprise and **cannot write to repos outside it** (even public ones). Ask
   the user to `! gh auth logout` then `! gh auth login` with a **personal**
   account that has access to the repo, and retry.
3. Reading a public repo with no auth works via the unauthenticated API — fine
   for the fetch step, but every write still needs a valid account.

## The line (per issue)

### 0. Fetch the work queue

```bash
gh issue list --repo <owner>/<name> --state open --limit 100
```

If `gh` can't read it but the repo is public, fall back to the REST API:
`curl -s "https://api.github.com/repos/<owner>/<name>/issues?state=open&per_page=100"`
and ignore any item that has a `pull_request` key (those are PRs, not issues).

Show the user the queue (number, title, author) and confirm scope before doing
destructive work (commenting/closing) across many issues.

### 1. Claim it — 👀 react (work-in-progress signal)

```bash
gh api --method POST \
  repos/<owner>/<name>/issues/<n>/reactions \
  -H "Accept: application/vnd.github+json" \
  -f content=eyes
```

`eyes` (👀) is the convention for "we're on it". Other valid contents:
`+1 -1 laugh confused heart hooray rocket`.

### 2. Do the work

Read the issue body and figure out what it actually asks. Research as needed
(web search, code inspection, etc.). If the issue is ambiguous, ask the user
rather than guessing. Keep the answer accurate and concise.

### 3. Answer — post a comment

```bash
gh issue comment <n> --repo <owner>/<name> --body "<your answer, markdown ok>"
```

For multi-line bodies in PowerShell use a single-quoted here-string; in Bash use
a quoted heredoc via `--body-file -` or `--body @'...'@`. Make the comment
self-contained (state the answer, then supporting detail).

### 4. Close it

```bash
gh issue close <n> --repo <owner>/<name>
```

Reopen if needed: `gh issue reopen <n> --repo <owner>/<name>`.

## Running on a loop

To keep processing new issues over time, hand off to the `/loop` skill with an
interval, e.g.:

```
/loop 10m run factory-loop over <owner>/<name>
```

Each firing re-fetches open issues and runs the line on anything new. Skip
issues that already carry your 👀 reaction (or are assigned/labeled as
in-progress) so you don't double-process. Stop the loop with CronDelete (the
loop skill reports the job ID) or by telling Claude to "stop the loop".

## Guardrails

- **Confirm before bulk writes.** Reacting is cheap; mass-commenting and closing
  is not. Summarize what you'll do across N issues and get a go-ahead unless the
  user already said "process everything".
- **Idempotency.** Before reacting/commenting, you may re-list to avoid repeating
  work on an issue already handled this run.
- **Report outcomes faithfully.** List each issue and what happened
  (reacted / answered / closed / skipped-and-why). Link the issue URLs.
- **One account, right scope.** Use a GitHub account that actually has write
  access to the target repo (see the EMU note above).
