# Todo app

A single-file, client-side todo app. No build step, no server, no account.

- **Run it:** open `todo/index.html` in any browser.
- **Storage:** tasks persist in the browser via `localStorage` (key `todo.items.v1`) —
  this is the "client-side db". Clearing site data wipes them.
- **Features:** create a task, mark it done (toggle), delete it. Remaining count shown.
- **Stack:** plain HTML + CSS + JS in one file (`index.html`), so it's trivial to host or open locally.

See the root `CLAUDE.md` for the factory index this project is registered in.
