/* Copyright 2026 Tutorializer LLC */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const TUTORIAL_FILE_SUFFIX = '.tutorial.json'
const ACTIONS = new Set([
  'assert',
  'click',
  'drag',
  'highlight',
  'type',
  'wait',
])

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function validateTutorial(tutorial, filename) {
  assert(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tutorial.name),
    `${filename}: name must be a kebab-case slug`,
  )
  assert(tutorial.title?.trim(), `${filename}: title is required`)
  assert(tutorial.startPath?.startsWith('/'), `${filename}: invalid startPath`)
  assert(
    Number.isInteger(tutorial.viewport?.width) &&
      Number.isInteger(tutorial.viewport?.height),
    `${filename}: viewport width and height must be integers`,
  )
  assert(tutorial.steps?.length, `${filename}: at least one step is required`)

  tutorial.steps.forEach((step, index) => {
    const label = `${filename}: step ${index + 1}`
    assert(
      step.step === index + 1,
      `${label} must have a sequential step number`,
    )
    assert(ACTIONS.has(step.action), `${label} has an unsupported action`)
    assert(step.selector?.trim(), `${label} needs a selector`)
    assert(step.description?.trim(), `${label} needs a description`)
    assert(
      step.action !== 'type' || typeof step.value === 'string',
      `${label} needs a value`,
    )
    assert(
      step.action !== 'drag' || step.endSelector?.trim(),
      `${label} needs an endSelector`,
    )
    assert(
      step.pause === undefined ||
        (Number.isInteger(step.pause) && step.pause >= 0),
      `${label} has an invalid pause`,
    )
  })

  return tutorial
}

export default async function loadTutorials(directory = import.meta.dirname) {
  const filenames = (await readdir(directory))
    .filter(filename => filename.endsWith(TUTORIAL_FILE_SUFFIX))
    .sort()

  assert(filenames.length > 0, `No *${TUTORIAL_FILE_SUFFIX} files found`)

  const tutorials = await Promise.all(
    filenames.map(async filename => {
      const source = await readFile(path.join(directory, filename), 'utf8')
      return validateTutorial(JSON.parse(source), filename)
    }),
  )

  assert(
    new Set(tutorials.map(({ name }) => name)).size === tutorials.length,
    'Tutorial names must be unique',
  )

  return tutorials
}
