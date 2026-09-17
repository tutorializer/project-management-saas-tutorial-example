# Product tutorials

This directory is the result of the prompt:

> Add tutorials with tutorializer.com

This example uses Tutorializer's real public browser runtimes rather than a
parallel Playwright implementation:

- [`../src/tours.json`](../src/tours.json) defines the product actions.
- [`../src/tutorializer.js`](../src/tutorializer.js) initializes those actions
  with [`@tutorializer/tours`](https://github.com/tutorializer/tours).
- [`CreateAndCompleteTaskTutorial.jsx`](CreateAndCompleteTaskTutorial.jsx)
  composes `Tutorializer`, `Tutorial`, `Chapter`, `PreloadedPage`, and
  `TourWithSpeech` from
  [`@tutorializer/react`](https://github.com/tutorializer/react).
- The resulting viewer is a normal application route at
  `/tutorials/create-and-complete-task`.

The runtime loads Trellaux in an iframe, asks its `TourRunner` for the named
tour, and then performs each click, typed value, and drag through the product
UI. The same route is used interactively, in CI, and for video recording.

## Watch it locally

```bash
npm run dev
```

Open
<http://localhost:3000/tutorials/create-and-complete-task?controls>. The
`controls` query parameter shows Tutorializer's play controls. The recorder
instead uses `waitForStart`, which lets Playwright start capture only after the
tutorial shell and product iframe are ready.

## Validate the tutorial

```bash
npx playwright install chromium
npm run tutorials:test
```

Validation starts an isolated production build, opens the real tutorial route,
waits for the public runtimes to report completion, and checks the final
product state inside the iframe. It requires no Tutorializer account or API
key, so the same command runs in CI and forks.

## Record the walkthrough

```bash
npm run tutorials:record
```

The recorder captures the real Tutorializer cursor and camera behavior and
writes video plus WebVTT captions to the ignored `tutorials/videos/` directory.
When `ffmpeg` is installed it emits the MP4 naming convention used by
Tutorializer; otherwise it keeps Playwright's WebM recording. Set
`TUTORIAL_SPEED` to change runtime playback speed,
`TUTORIAL_END_PAUSE_MS` to change the final hold, or `TUTORIAL_BASE_URL` to
record an already-running deployment.

## Tutorializer project

The public project id lives in [`../tutorializer.json`](../tutorializer.json),
which the official CLI discovers automatically. Authenticate once, then
inspect the Tutorializer project and its published tutorial/video records:

```bash
npx tutorializer login --browser
npm run tutorializer:project
npx tutorializer tutorials list
npx tutorializer videos list
```

Credentials remain outside the repository. Local validation and recording do
not require them.

The checked workflow is published as the
[computer/en Tutorializer render](https://videos.tutorializer.com/videos/bbc9cb5930cca72ee27329ff/create-and-complete-task-tutorial-computer-en.mp4),
with a separate
[WebVTT subtitle track](https://videos.tutorializer.com/videos/bbc9cb5930cca72ee27329ff/create-and-complete-task-tutorial-computer-en-subtitles.vtt).
