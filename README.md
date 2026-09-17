# Project-management SaaS example

A small, fully local project-management SaaS for experimenting with common
board and task workflows.

The app is TanStack's MIT-licensed **Trellaux** demo: a Trello-like board with
columns, cards, drag-and-drop, optimistic updates, and an in-memory backend. It
needs no account, database, API key, or hosted service, which makes its product
flows deterministic enough to teach and record.

```bash
git clone https://github.com/tutorializer/project-management-saas-tutorial-example.git
cd project-management-saas-tutorial-example
npm install
npm run dev
```

Open <http://localhost:3000>, select **First board**, create a column, and add a
card. All data is held in the running server's memory and resets when the
server restarts.

## Why this base app

This repository is organized around a kind of product—project-management
SaaS—not around its framework. The same tutorial should be recognizable to
someone building a store, search product, booking tool, or dashboard:

1. enter a real workflow;
2. perform a small outcome-oriented task;
3. verify the resulting product state.

The app is intentionally self-contained. A tutorial should not pass only when
a maintainer's private Shopify store, database, or search cluster happens to
be online.

## Commands

```bash
npm run dev       # development server on http://localhost:3000
npm run build     # production build plus TypeScript checking
npm run preview   # preview the production build
```

## Upstream

The base application comes from
[`TanStack/router/examples/react/start-trellaux`](https://github.com/TanStack/router/tree/main/examples/react/start-trellaux).
See [UPSTREAM.md](UPSTREAM.md) for the pinned revision and [LICENSE](LICENSE)
for its MIT license.
