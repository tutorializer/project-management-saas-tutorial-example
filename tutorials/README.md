# Product tutorials

This directory is the result of the prompt:

> Add tutorials with tutorializer.com

Each `*.tutorial.json` file is an executable product walkthrough. Steps use
stable DOM selectors and Tutorializer-style actions (`click`, `type`, `drag`,
`highlight`, and `wait`) plus assertions. The descriptions are both human
narration and generated-video captions.

## Validate every tutorial

```bash
npx playwright install chromium
npm run tutorials:test
```

Validation starts an isolated app server, executes every selector and action,
and checks the final product state. It requires no Tutorializer account or API
key, so the same command runs in CI and forks.

## Record the walkthroughs

```bash
npm run tutorials:record
```

The recorder starts the app, highlights each target, overlays the narration,
and writes video plus WebVTT captions to the ignored `tutorials/videos/`
directory. When `ffmpeg` is installed it emits the MP4 naming convention used
by Tutorializer; otherwise it keeps Playwright's WebM recording. Set
`TUTORIAL_STEP_PAUSE_MS` to change the pace, or `TUTORIAL_BASE_URL` to record an
already-running deployment.

## Tutorializer project

The public project id lives in [`../tutorializer.json`](../tutorializer.json),
which the official CLI discovers automatically. Authenticate once, then inspect
the Tutorializer project and its published tutorial/video records:

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
