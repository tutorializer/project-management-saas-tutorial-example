/* Copyright 2026 Tutorializer LLC */

const STEP_TIMEOUT_MS = 15_000

const waitForVisible = locator =>
  locator.waitFor({ state: 'visible', timeout: STEP_TIMEOUT_MS })

export default async function runTutorial({
  page,
  tutorial,
  pauseMs = 0,
  onStep = async () => {},
}) {
  await page.goto(tutorial.startPath, { waitUntil: 'domcontentloaded' })

  for (const step of tutorial.steps) {
    const locator = page.locator(step.selector).first()
    await waitForVisible(locator)
    await onStep({ page, step, tutorial })

    switch (step.action) {
      case 'assert':
      case 'wait':
        break
      case 'click':
        await locator.click()
        break
      case 'drag': {
        const target = page.locator(step.endSelector).first()
        await waitForVisible(target)
        await locator.dragTo(target)
        break
      }
      case 'highlight':
        await locator.evaluate(element => {
          element.dataset.tutorializerHighlight = 'true'
        })
        break
      case 'type':
        await locator.fill(step.value)
        break
      default:
        throw new Error(`Unsupported tutorial action: ${step.action}`)
    }

    if (step.waitFor) {
      await waitForVisible(page.locator(step.waitFor).first())
    }

    const stepPauseMs = Math.max(pauseMs, step.pause || 0)
    if (stepPauseMs > 0) {
      await page.waitForTimeout(stepPauseMs)
    }
  }
}
