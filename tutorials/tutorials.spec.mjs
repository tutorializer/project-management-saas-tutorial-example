/* Copyright 2026 Tutorializer LLC */

// oxlint-disable-next-line import-js/no-extraneous-dependencies
import { expect, test } from '@playwright/test'

import { speechEntries } from './speeches.js'

const tutorialUrl = '/tutorials/create-and-complete-task?waitForStart&speed=1'

test.setTimeout(180_000)

const readTutorialOutcome = page =>
  page.evaluate(() => {
    if (window.tutorializer?.tourError) {
      return { status: 'error', error: window.tutorializer.tourError }
    }

    if (window.tutorializer?.timings?.tutorialComplete) {
      return { status: 'complete' }
    }

    return null
  })

test('Create and complete a task', async ({ page }) => {
  const pageErrors = []
  const requestedSpeechUrls = new Set()
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname
    if (pathname.startsWith('/speeches/create-and-complete-task/')) {
      requestedSpeechUrls.add(pathname)
    }
  })

  await page.goto(tutorialUrl)
  await expect(page.locator('[data-tutorial-ready]')).toBeAttached()

  const product = page.frameLocator('iframe[title="Trellaux"]')
  await expect(product.locator("[data-testid='board-1']")).toBeVisible()

  await page.locator('body').evaluate(body => {
    body.setAttribute('data-recording-started', '')
  })

  await expect
    .poll(() => readTutorialOutcome(page), {
      message: 'the Tutorializer runtime should complete without a tour error',
      timeout: 170_000,
    })
    .not.toBeNull()

  expect(await readTutorialOutcome(page)).toEqual({ status: 'complete' })

  await expect(
    product.locator(
      "[data-column-name='Done'] [data-card-title='Publish the launch checklist']",
    ),
  ).toBeVisible()
  const speechTimings = await page.evaluate(
    () => window.tutorializer?.timings?.speechTimings || [],
  )
  expect(speechTimings.map(({ text }) => text)).toEqual(
    speechEntries.map(({ text }) => text),
  )
  expect([...requestedSpeechUrls].sort()).toEqual(
    speechEntries.map(({ publicUrl }) => publicUrl).sort(),
  )
  expect(pageErrors).toEqual([])
})
