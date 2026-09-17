/* Copyright 2026 Tutorializer LLC */

// oxlint-disable-next-line import-js/no-extraneous-dependencies
import { expect, test } from '@playwright/test'

const tutorialUrl = '/tutorials/create-and-complete-task?waitForStart&speed=20'

test.setTimeout(120_000)

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
  page.on('pageerror', error => pageErrors.push(error.message))

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
      timeout: 120_000,
    })
    .toEqual({ status: 'complete' })

  await expect(
    product.locator(
      "[data-column-name='Done'] [data-card-title='Publish the launch checklist']",
    ),
  ).toBeVisible()
  expect(pageErrors).toEqual([])
})
