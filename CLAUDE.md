# Software Factory · Contour × Jonas

We are building a **software factory**: a repo where incoming tickets (GitHub
issues) are turned into working software by an automated **loop**, not by hand.
We improve the loop and the factory's shared machinery; the loop builds the
features. Program rules live in `README.md`.

## Progressive disclosure

This file is the **index and nothing more**. Keep it **under 100 lines, always**.

- Put details where they are used, not here. Every project and tool carries its
  own docs; this file only points to them.
- Load deeper context on demand — open a project's own `CLAUDE.md` when you work
  inside that project's folder, not before.
- When an entry here grows past a line or two, move it into the relevant folder
  and leave a link behind.

## Layout

- **One project per folder.** A new project `foo` lives in `projects/foo/` with
  its own `CLAUDE.md` describing just that project.
- Shared factory machinery lives in `.claude/` (skills, settings).
- The index below is **managed here and only here** — add every new project.

## Project index

| Project | Folder | Status | Docs |
|---------|--------|--------|------|
| Todo app | `todo/` | Live | `todo/CLAUDE.md` |

## Factory tooling

| Tool | Location | Purpose |
|------|----------|---------|
| factory-loop | `.claude/skills/factory-loop/` | Processes open issues: 👀 claim → research → comment → close |

## Working agreement

- Tickets arrive as GitHub issues; the loop picks them up and does the work.
- Only what is pushed to `main` counts: files, issues, comments, commits.
- Keep this index current: new project → new folder → new row above.
