/* Copyright 2026 Tutorializer LLC */

// oxlint-disable-next-line import-js/no-extraneous-dependencies
import { expect, test } from '@playwright/test'

import loadTutorials from './loadTutorials.mjs'
import runTutorial from './runTutorial.mjs'

const tutorials = await loadTutorials()

for (const tutorial of tutorials) {
  test(tutorial.title, async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))

    await page.setViewportSize(tutorial.viewport)
    await runTutorial({ page, tutorial })

    await expect(
      page
        .locator("[data-column-name='Done']")
        .getByText('Publish the launch checklist'),
    ).toBeVisible()
    expect(pageErrors).toEqual([])
  })
}
