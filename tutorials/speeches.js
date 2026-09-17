/* Copyright 2026 Tutorializer LLC */

const speechDirectory = 'speeches/create-and-complete-task'

export const speechEntries = [
  {
    step: 1,
    text: 'Open the First board to begin.',
    fileName: '01-open-first-board.mp3',
  },
  {
    step: 2,
    text: 'Name the first workflow column To do.',
    fileName: '02-name-to-do-column.mp3',
  },
  {
    step: 3,
    text: 'Save the To do column.',
    fileName: '03-save-to-do-column.mp3',
  },
  {
    step: 4,
    text: 'Now name the second workflow column Done.',
    fileName: '04-name-done-column.mp3',
  },
  {
    step: 5,
    text: 'Save the Done column.',
    fileName: '05-save-done-column.mp3',
  },
  {
    step: 6,
    text: 'Add a new task to the To do column.',
    fileName: '06-add-task.mp3',
  },
  {
    step: 7,
    text: 'Enter a clear title for the task: Publish the launch checklist.',
    fileName: '07-enter-task-title.mp3',
  },
  {
    step: 8,
    text: 'Save the new task.',
    fileName: '08-save-task.mp3',
  },
  {
    step: 9,
    text: 'When the work is finished, drag the task from To do to Done.',
    fileName: '09-move-task-to-done.mp3',
  },
  {
    step: 10,
    text: 'The launch checklist is now complete in the Done column.',
    fileName: '10-task-complete.mp3',
  },
].map(entry => ({
  ...entry,
  assetPath: `public/${speechDirectory}/${entry.fileName}`,
  publicUrl: `/${speechDirectory}/${entry.fileName}`,
}))

const speeches = Object.fromEntries(
  speechEntries.map(({ text, publicUrl }) => [
    text,
    {
      // TourWithSpeech accepts any browser-playable audio source here. Keeping
      // the files as public assets avoids embedding base64 in the app bundle.
      base64: publicUrl,
    },
  ]),
)

export default speeches
