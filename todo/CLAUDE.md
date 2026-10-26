# Todo app

A single-file, client-side todo app. No build step, no server, no account.

- **Run it:** open `todo/index.html` in any browser.
- **Storage:** tasks persist in the browser via `localStorage` (key `todo.items.v3`) —
  this is the "client-side db". Clearing site data wipes them. Old `v1`/`v2` data is
  auto-migrated on first load.
- **Features:** create a task, mark it done (toggle), delete it. Per task: a **due
  date** (overdue tasks flagged), **tags**, and **recurrence** (none / daily /
  weekly / monthly). Completing a recurring task auto-creates the next occurrence
  with its due date advanced by the cadence. Filter by **status** (all / active /
  completed) and by **tag** (dropdown, or click a tag chip). Remaining count shown.
- **Stack:** plain HTML + CSS + JS in one file (`index.html`), so it's trivial to host or open locally.

See the root `CLAUDE.md` for the factory index this project is registered in.
