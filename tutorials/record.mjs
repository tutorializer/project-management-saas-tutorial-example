/* Copyright 2026 Tutorializer LLC */

import { spawn, spawnSync } from 'node:child_process'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

// oxlint-disable-next-line import-js/no-extraneous-dependencies
import { chromium } from '@playwright/test'

import loadTutorials from './loadTutorials.mjs'
import runTutorial from './runTutorial.mjs'

const exampleDirectory = path.resolve(import.meta.dirname, '..')
const videosDirectory = path.join(import.meta.dirname, 'videos')
const port = 3101
const managedBaseUrl = `http://127.0.0.1:${port}`
const baseURL = process.env.TUTORIAL_BASE_URL || managedBaseUrl
const paceMs = Number(process.env.TUTORIAL_STEP_PAUSE_MS || 900)

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

const showStep = async ({ page, step, tutorial }) => {
  await page.evaluate(
    ({ description, number, total }) => {
      document
        .querySelectorAll('[data-tutorializer-focus]')
        .forEach(element => {
          element.removeAttribute('data-tutorializer-focus')
          element.style.outline = ''
          element.style.outlineOffset = ''
        })

      let overlay = document.querySelector('[data-tutorializer-caption]')
      if (!overlay) {
        overlay = document.createElement('div')
        overlay.setAttribute('data-tutorializer-caption', '')
        Object.assign(overlay.style, {
          position: 'fixed',
          zIndex: '2147483647',
          left: '50%',
          bottom: '28px',
          transform: 'translateX(-50%)',
          maxWidth: 'min(760px, calc(100vw - 48px))',
          padding: '14px 20px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.94)',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.32)',
          color: 'white',
          font: '600 18px/1.4 system-ui, sans-serif',
          textAlign: 'center',
          pointerEvents: 'none',
        })
        document.body.append(overlay)
      }

      overlay.textContent = `${number}/${total} · ${description}`
    },
    {
      description: step.description,
      number: step.step,
      total: tutorial.steps.length,
    },
  )

  await page
    .locator(step.selector)
    .first()
    .evaluate(element => {
      element.setAttribute('data-tutorializer-focus', '')
      element.style.outline = '4px solid #f97316'
      element.style.outlineOffset = '4px'
    })
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

const convertToMp4 = async ({ inputPath, outputPath }) => {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      inputPath,
      '-an',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
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

const recordTutorial = async ({ browser, tutorial }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: tutorial.viewport,
    recordVideo: {
      dir: videosDirectory,
      size: tutorial.viewport,
    },
  })
  const page = await context.newPage()
  const startedAt = performance.now()
  const cues = []

  await runTutorial({
    page,
    tutorial,
    pauseMs: paceMs,
    onStep: async event => {
      cues.push({
        start: performance.now() - startedAt,
        text: event.step.description,
      })
      await showStep(event)
      await page.waitForTimeout(paceMs)
    },
  })
  await page.waitForTimeout(paceMs)

  const duration = performance.now() - startedAt
  const video = page.video()
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
  browser = await chromium.launch()

  for (const tutorial of await loadTutorials()) {
    await recordTutorial({ browser, tutorial })
  }
} finally {
  await browser?.close()
  stopServer(server)
}
