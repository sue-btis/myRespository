import { expect, test, type Page } from '@playwright/test'

const AREAS = ['fullstack', 'ai', 'design'] as const
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

test('choosing again or Escape returns to neutral', async ({ page }) => {
  await page.goto('/')
  await ready(page)

  await card(page, 'ai').click()
  await card(page, 'ai').click()
  await expect(face(page)).toHaveAttribute('data-face', 'neutral')

  await card(page, 'design').click()
  await expect(face(page)).toHaveAttribute('data-face', 'design')
  await page.keyboard.press('Escape')
  await expect(face(page)).toHaveAttribute('data-face', 'neutral')
})

test('an area without a project is not shown', async ({ page }) => {
  await page.goto('/?face=data')
  await ready(page)
  await expect(card(page, 'data')).toHaveCount(0)
  await expect(page.locator('.slot[data-area="data"]')).toHaveCount(0)
  await expect(face(page)).toHaveAttribute('data-face', 'neutral')
})

test('the console boots the active area project when it scrolls into view, and Escape returns to the slots', async ({ page }) => {
  await page.goto('/?face=ai')
  await ready(page)
  await expect(page.locator('.screen')).toHaveAttribute('data-view', 'select')

  await page.locator('.console').scrollIntoViewIfNeeded()
  await expect(page.locator('.screen')).toHaveAttribute('data-view', 'changesmith')
  await expect(page.locator('.console__hint')).toContainText('ChangeSmith loaded')

  await page.keyboard.press('Escape')
  await expect(page.locator('.screen')).toHaveAttribute('data-view', 'select')
  await expect(face(page)).toHaveAttribute('data-face', 'ai')

  await page.locator('.slot[data-area="fullstack"]').click()
  await expect(page.locator('.screen')).toHaveAttribute('data-view', 'trainlog')
  await expect(page.locator('.console')).not.toHaveAttribute('data-busy', '')
})

test('Write to me copies the address and confirms it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await ready(page)
  await page.locator('.hctas a[href^="mailto:"]').click()
  await expect(page.locator('.hctas [role="status"]')).toHaveText('Email copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('josuee152@gmail.com')
})

test('keys 1 to 3 switch areas', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  for (const [i, area] of AREAS.entries()) {
    await page.keyboard.press(String(i + 1))
    await expect(face(page)).toHaveAttribute('data-face', area)
    await expect(card(page, area)).toHaveAttribute('aria-pressed', 'true')
  }
})

test('?face= is applied before the app starts', async ({ page }) => {
  await page.goto('/?face=design')
  await expect(face(page)).toHaveAttribute('data-face', 'design')
  await expect(card(page, 'design')).toHaveAttribute('aria-pressed', 'true')
})

test('links without a target never render as live anchors', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href="#"]')).toHaveCount(0)
})

test('tabbing into the Work console keeps focus on the cartridge', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  const slot = page.locator('.slot').first()
  // Focusing scrolls the console into view, which is what used to trigger the auto-boot.
  await slot.focus()
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => document.activeElement?.classList.contains('slot'))).toBe(true)
  await expect(page.locator('.screen')).toHaveAttribute('data-view', 'select')
})

test('scrolling to the Work console boots a project', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.locator('#work').scrollIntoViewIfNeeded()
  await expect(page.locator('.screen')).not.toHaveAttribute('data-view', 'select')
})
