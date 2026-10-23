import { expect, test, type Page } from '@playwright/test'

const AREAS = ['fullstack', 'ai', 'data', 'design'] as const
const cardRowTop = (page: Page) => page.locator('.cards').evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY))
const card = (page: Page, area: string) => page.locator(`.ac[data-area="${area}"]`)
const face = (page: Page) => page.locator('html')
// Passive effects (the key listener) attach right after first paint, not at the load event.
const ready = async (page: Page) => {
  await expect(card(page, 'ai')).toBeVisible()
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
}

test('choosing an area reskins the site without moving the card row', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const neutralTop = await cardRowTop(page)

  for (const area of AREAS) {
    await card(page, area).click()
    await expect(card(page, area)).toHaveAttribute('aria-pressed', 'true')
    await expect(face(page)).toHaveAttribute('data-face', area)
    await page.evaluate(() => document.fonts.ready)
    expect(await cardRowTop(page)).toBe(neutralTop)
  }
})

test('choosing again or Escape returns to neutral, and an empty slot previews its area', async ({ page }) => {
  await page.goto('/')
  await ready(page)

  await card(page, 'ai').click()
  await card(page, 'ai').click()
  await expect(face(page)).toHaveAttribute('data-face', 'neutral')

  await page.locator('.slot--empty[data-area="data"]').click()
  await page.getByRole('button', { name: 'Preview this style' }).click()
  await expect(face(page)).toHaveAttribute('data-face', 'data')
  await page.keyboard.press('Escape')
  await expect(face(page)).toHaveAttribute('data-face', 'neutral')
})

test('opening a slot boots the project and Escape returns to the slots without changing the face', async ({ page }) => {
  await page.goto('/?face=data')
  await ready(page)
  await page.locator('.slot[data-area="fullstack"]').click()
  await expect(page.locator('.screen')).toHaveAttribute('data-view', 'trainlog')
  await expect(page.locator('.console')).not.toHaveAttribute('data-busy', '')

  await page.keyboard.press('Escape')
  await expect(page.locator('.screen')).toHaveAttribute('data-view', 'select')
  await expect(face(page)).toHaveAttribute('data-face', 'data')
})

test('keys 1 to 4 switch areas', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  for (const [i, area] of AREAS.entries()) {
    await page.keyboard.press(String(i + 1))
    await expect(face(page)).toHaveAttribute('data-face', area)
    await expect(card(page, area)).toHaveAttribute('aria-pressed', 'true')
  }
})

test('?face= is applied before the app starts', async ({ page }) => {
  await page.goto('/?face=data')
  await expect(face(page)).toHaveAttribute('data-face', 'data')
  await expect(card(page, 'data')).toHaveAttribute('aria-pressed', 'true')
})

test('links without a target never render as live anchors', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href="#"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /CV/ })).toHaveCount(0)
  // CV in the bar and in the close section.
  await expect(page.locator('.pend')).toHaveCount(2)
})
