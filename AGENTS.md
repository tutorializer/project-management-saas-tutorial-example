# Project-management SaaS example

This is a standalone public example, not a member of a parent pnpm workspace.
Use npm and the committed `package-lock.json`; do not import packages from a
parent monorepo or rely on parent `node_modules` resolution.

## Product

Trellaux is a small project-management SaaS. Its server starts with one empty
board named `First board`. Users can create, rename, reorder, and delete
columns and cards. State is in memory and resets with the server process.

## Commands

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run tutorials:test
npm run tutorials:record
```

The development server uses <http://localhost:3000>. The production build also
runs TypeScript's no-emit check. Install Chromium once with
`npx playwright install chromium` before tutorial validation or recording.

## Tutorials

The executable product steps live in `src/tours.json`, and
`src/tutorializer.js` initializes them with `@tutorializer/tours`. The viewer
route at `/tutorials/create-and-complete-task` renders the chapter in
`tutorials/CreateAndCompleteTaskTutorial.jsx` with `@tutorializer/react`.
`tutorials/speeches.js` maps each step description to its committed narration
asset under `public/speeches/`; keep those texts identical to `tours.json`.

Keep tours focused on user outcomes, use existing accessible attributes or
stable `data-testid` selectors, and describe each action as narration. Every
tutorial must run through `npm run tutorials:test` without credentials. The
test and recorder must drive the real Tutorializer route; do not create a
second Playwright-only action implementation or custom overlay. The recorder
mixes the same per-step files played by `TourWithSpeech` at the runtime's
reported speech timestamps. Generated videos, captions, traces, and test
results stay uncommitted.

`tutorializer.json` contains only the public Tutorializer project id. Never add
an API key or browser session to this repository.

## Provenance

The app was copied from TanStack Router's MIT-licensed `start-trellaux`
example. Keep `UPSTREAM.md` and `LICENSE` when modifying or redistributing it.

## Publishing

This repository is a read-only mirror developed in a private monorepo. Public
changes are overwritten on the next publish. The monorepo invokes its private
publisher directly; there is deliberately no public `publish:repo` script.
