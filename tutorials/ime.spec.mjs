/* Copyright 2026 Tutorializer LLC */

// eslint-disable-next-line import-js/no-extraneous-dependencies -- Standalone spec uses its declared Playwright dev dependency.
import { expect, test } from '@playwright/test'

test('card title uses native form submission after IME conversion', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('board-1').click()
  const column = page.getByTestId('new-column-form')
  await column.locator('input[name="columnName"]').fill('IME verification')
  await page.getByTestId('save-column').click()
  await expect(
    page.locator('[data-column-name="IME verification"]'),
  ).toBeVisible()
  // Re-enter with the server's persisted column ID, after the optimistic row.
  await page.reload()
  await page
    .locator('[data-column-name="IME verification"]')
    .getByTestId('add-card')
    .click()
  const title = page.locator(
    '[data-testid="new-card-form"] input[name="title"]',
  )
  await title.focus()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.imeSetComposition', {
    text: 'たいとる',
    selectionStart: 4,
    selectionEnd: 4,
  })
  for (const keyboard of [
    { isComposing: true, keyCode: 13 },
    { isComposing: false, keyCode: 229 },
  ]) {
    const allowed = await title.evaluate(
      (element, shape) =>
        element.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
            ...shape,
          }),
        ),
      keyboard,
    )
    expect(allowed).toBe(true)
    await expect(title).toHaveValue('たいとる')
    await expect(page.locator('[data-card-title="たいとる"]')).toHaveCount(0)
  }
  // CDP has no OS candidate window: commit the conversion explicitly.
  await cdp.send('Input.insertText', { text: 'タイトル' })
  await expect(title).toHaveValue('タイトル')
  await expect(page.locator('[data-card-title="タイトル"]')).toHaveCount(0)
  await title.press('Enter')
  await expect(page.locator('[data-card-title="タイトル"]')).toBeVisible()
  await page
    .locator('[data-column-name="IME verification"]')
    .getByRole('button', { name: 'Delete column' })
    .click()
  await expect(
    page.locator('[data-column-name="IME verification"]'),
  ).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('new-column-form')).toBeVisible()
})
