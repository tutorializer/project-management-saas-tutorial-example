/* Copyright 2026 Tutorializer LLC */

import { spawn, spawnSync } from 'node:child_process'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

// oxlint-disable-next-line import-js/no-extraneous-dependencies
import { chromium } from '@playwright/test'

import { speechEntries } from './speeches.js'

const exampleDirectory = path.resolve(import.meta.dirname, '..')
const videosDirectory = path.join(import.meta.dirname, 'videos')
const port = 3101
const managedBaseUrl = `http://127.0.0.1:${port}`
const baseURL = process.env.TUTORIAL_BASE_URL || managedBaseUrl
const speed = Number(process.env.TUTORIAL_SPEED || 1)
const endPauseMs = Number(process.env.TUTORIAL_END_PAUSE_MS || 900)

const tutorial = {
  name: 'create-and-complete-task',
  title: 'Create and complete a task',
  viewport: { width: 1280, height: 808 },
}

const speechEntryByText = new Map(
  speechEntries.map(entry => [entry.text, entry]),
)

const waitForServer = async url => {
  const deadline = Date.now() + 120_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // The app server has not bound its port yet.
    }

    await new Promise(resolve => {
      setTimeout(resolve, 250)
    })
  }

  throw new Error(`Timed out waiting for ${url}`)
}

const startServer = () => {
  if (process.env.TUTORIAL_BASE_URL) return null

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const build = spawnSync(npmCommand, ['run', 'build'], {
    cwd: exampleDirectory,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: 'inherit',
  })

  if (build.error) throw build.error
  if (build.status !== 0) {
    throw new Error(`Tutorial app build exited with status ${build.status}`)
  }

  return spawn(
    npmCommand,
    ['run', 'start', '--', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: exampleDirectory,
      detached: process.platform !== 'win32',
      env: { ...process.env, NO_COLOR: '1' },
      stdio: 'inherit',
    },
  )
}

const stopServer = server => {
  if (!server || server.exitCode !== null) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'])
  } else {
    process.kill(-server.pid, 'SIGTERM')
  }
}

const formatVttTime = milliseconds => {
  const value = Math.max(0, Math.round(milliseconds))
  const hours = Math.floor(value / 3_600_000)
  const minutes = Math.floor((value % 3_600_000) / 60_000)
  const seconds = Math.floor((value % 60_000) / 1000)
  const millis = value % 1000
  return [hours, minutes, seconds]
    .map(part => String(part).padStart(2, '0'))
    .join(':')
    .concat('.', String(millis).padStart(3, '0'))
}

const createCaptions = (cues, duration) => {
  const blocks = cues.map((cue, index) => {
    const end = cues[index + 1]?.start ?? duration
    return `${index + 1}\n${formatVttTime(cue.start)} --> ${formatVttTime(end)}\n${cue.text}`
  })

  return `WEBVTT\n\n${blocks.join('\n\n')}\n`
}

const convertToMp4 = async ({ inputPath, outputPath, cues, duration }) => {
  const narration = cues.map(cue => {
    const entry = speechEntryByText.get(cue.text)
    if (!entry) {
      throw new Error(`No narration asset is registered for "${cue.text}"`)
    }

    return {
      ...cue,
      path: path.join(exampleDirectory, entry.assetPath),
    }
  })
  const audioInputArguments = narration.flatMap(cue => ['-i', cue.path])
  const delayedAudio = narration.map((cue, index) => {
    const inputIndex = index + 2
    const delay = Math.max(0, Math.round(cue.start))
    return `[${inputIndex}:a]adelay=${delay}:all=1[speech${index}]`
  })
  const audioInputs = [
    '[1:a]',
    ...narration.map((_, index) => `[speech${index}]`),
  ].join('')
  const filter = [
    ...delayedAudio,
    `${audioInputs}amix=inputs=${narration.length + 1}:duration=longest:dropout_transition=0:normalize=0[audio]`,
  ].join(';')
  const durationSeconds = (duration / 1000).toFixed(3)

  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      inputPath,
      '-f',
      'lavfi',
      '-t',
      durationSeconds,
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=48000',
      ...audioInputArguments,
      '-filter_complex',
      filter,
      '-map',
      '0:v:0',
      '-map',
      '[audio]',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-t',
      durationSeconds,
      '-movflags',
      '+faststart',
      outputPath,
    ],
    { stdio: 'inherit' },
  )

  if (result.error?.code === 'ENOENT') return null
  if (result.status !== 0) {
    throw new Error(`ffmpeg exited with status ${result.status}`)
  }

  await unlink(inputPath)
  return outputPath
}

const waitForTutorial = async ({
  page,
  recordingLeadIn,
  recordingStartTime,
}) => {
  const deadline = Date.now() + 180_000

  while (Date.now() < deadline) {
    const state = await page.evaluate(() => ({
      complete: Boolean(window.tutorializer?.timings?.tutorialComplete),
      error: window.tutorializer?.tourError || null,
      speechTimings: window.tutorializer?.timings?.speechTimings || [],
    }))

    if (state.error) {
      throw new Error(state.error.detail || JSON.stringify(state.error))
    }

    if (state.complete) {
      return state.speechTimings.map(({ text, startTime }) => ({
        start: recordingLeadIn + (startTime - recordingStartTime),
        text,
      }))
    }
    await page.waitForTimeout(50)
  }

  throw new Error(`Timed out recording "${tutorial.title}"`)
}

const recordTutorial = async browser => {
  const context = await browser.newContext({
    baseURL,
    viewport: tutorial.viewport,
    recordVideo: {
      dir: videosDirectory,
      size: tutorial.viewport,
    },
  })
  const page = await context.newPage()
  const video = page.video()
  const startedAt = performance.now()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto(
    `/tutorials/${tutorial.name}?waitForStart&speed=${encodeURIComponent(speed)}`,
  )
  await page.locator('[data-tutorial-ready]').waitFor()

  const product = page.frameLocator('iframe[title="Trellaux"]')
  await product.locator("[data-testid='board-1']").waitFor()

  const recordingStartTime = await page.locator('body').evaluate(body => {
    body.setAttribute('data-recording-started', '')
    return performance.now()
  })
  const recordingLeadIn = performance.now() - startedAt

  const cues = await waitForTutorial({
    page,
    recordingLeadIn,
    recordingStartTime,
  })
  if (cues.length !== speechEntries.length) {
    throw new Error(
      `Expected ${speechEntries.length} narrated steps, received ${cues.length}`,
    )
  }
  await product
    .locator(
      "[data-column-name='Done'] [data-card-title='Publish the launch checklist']",
    )
    .waitFor()
  await page.waitForTimeout(endPauseMs)

  if (pageErrors.length) {
    throw new Error(`Browser errors:\n${pageErrors.join('\n')}`)
  }

  const duration = performance.now() - startedAt
  await context.close()
  const temporaryPath = await video.path()

  const basename = `${tutorial.name}-tutorial-computer-en`
  const outputPath = path.join(videosDirectory, `${basename}.webm`)
  await video.saveAs(outputPath)
  if (temporaryPath !== outputPath) {
    await unlink(temporaryPath).catch(() => {})
  }
  await writeFile(
    path.join(videosDirectory, `${basename}-subtitles.vtt`),
    createCaptions(cues, duration),
  )

  const mp4Path = await convertToMp4({
    inputPath: outputPath,
    outputPath: path.join(videosDirectory, `${basename}.mp4`),
    cues,
    duration,
  })
  const finalPath = mp4Path || outputPath
  console.log(`Recorded ${path.relative(exampleDirectory, finalPath)}`)
  if (!mp4Path) {
    console.log('Install ffmpeg to produce a Tutorializer-ready MP4.')
  }
}

const server = startServer()
let browser

try {
  await mkdir(videosDirectory, { recursive: true })
  await waitForServer(baseURL)
  browser = await chromium.launch({
    args: ['--autoplay-policy=no-user-gesture-required'],
  })
  await recordTutorial(browser)
} finally {
  await browser?.close()
  stopServer(server)
}
