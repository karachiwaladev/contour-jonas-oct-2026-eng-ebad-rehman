# Todo app

A single-file, client-side todo app. No build step, no server, no account.

- **Run it:** open `todo/index.html` in any browser.
- **Storage:** tasks persist in the browser via `localStorage` (key `todo.items.v4`) —
  this is the "client-side db". Clearing site data wipes them. Old `v1`/`v2`/`v3`
  data is auto-migrated on first load.
- **Features:** create a task, mark it done (toggle), **edit** it (inline: text,
  due date, tags, repeat, priority), delete it. Per task: a **priority** (low /
  medium / high, colored badge), a **due date** (overdue tasks flagged), **tags**,
  and **recurrence** (none / daily / weekly / monthly) that auto-creates the next
  occurrence on completion. Filter by **status** (all / active / completed), by
  **priority**, and by **tag**; high-priority tasks sort first. Footer shows **open / done / total** counts (with `· showing N` when filtered).
- **Stack:** plain HTML + CSS + JS in one file (`index.html`), so it's trivial to host or open locally.

See the root `CLAUDE.md` for the factory index this project is registered in.
