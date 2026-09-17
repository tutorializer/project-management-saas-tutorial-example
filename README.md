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

## Tutorializer example

This repository has two intentionally useful states:

- [`without-tutorializer`](https://github.com/tutorializer/project-management-saas-tutorial-example/tree/without-tutorializer)
  is the untouched, runnable product used as the starting point for agent evals
  and videos.
- `main` is the result of giving that base repository one prompt:

  > Add tutorials with tutorializer.com

The result uses the same two public runtime layers as Tutorializer's production
tutorials: [`src/tours.json`](src/tours.json) is executed inside the product by
[`@tutorializer/tours`](https://github.com/tutorializer/tours), and the viewer
route is composed in [`tutorials/`](tutorials/README.md) with
[`@tutorializer/react`](https://github.com/tutorializer/react). Both GitHub
dependencies are pinned to tested commits in `package.json`.

The included deterministic walkthrough creates a two-column workflow, adds a
task, and drags the task to **Done**. Each product action is narrated through
`TourWithSpeech`; the committed speech assets make playback and recording
credential-free. Run it in a browser at
<http://localhost:3000/tutorials/create-and-complete-task?controls>. The
verified computer/en render is
[published on Tutorializer](https://videos.tutorializer.com/videos/bbc9cb5930cca72ee27329ff/create-and-complete-task-tutorial-computer-en.mp4).

```bash
npx playwright install chromium
npm run tutorials:test    # execute the real Tutorializer route and assert its result
npm run tutorials:record  # record that route with narration and WebVTT captions
```

The test and recorder need no credentials. `tutorializer.json` links the repo
to its public Tutorializer project; sign in with the official CLI only when you
want to inspect its cloud tutorial and video records.

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
npm run tutorials:test
npm run tutorials:record
```

## Upstream

The base application comes from
[`TanStack/router/examples/react/start-trellaux`](https://github.com/TanStack/router/tree/main/examples/react/start-trellaux).
See [UPSTREAM.md](UPSTREAM.md) for the pinned revision and [LICENSE](LICENSE)
for its MIT license.
