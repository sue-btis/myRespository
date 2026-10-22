import { expect, test } from '@playwright/test'

const slotRowTop = (page: import('@playwright/test').Page) =>
  page.locator('.slots').evaluate((el) => Math.round(el.getBoundingClientRect().top))

test('inserting an area reskins the site without moving the slot row', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const neutralTop = await slotRowTop(page)
  const slots = page.locator('.slots .slot')

  for (let i = 0; i < (await slots.count()); i++) {
    const slot = slots.nth(i)
    await slot.click()
    await expect(slot).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('html')).not.toHaveAttribute('data-face', 'neutral')
    await page.evaluate(() => document.fonts.ready)
    expect(await slotRowTop(page)).toBe(neutralTop)
  }
})

test("the inserted area's project comes first, and ejecting restores neutral", async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /AI & Agents/ }).click()

  const first = await page.locator('.work .project').evaluateAll((els) =>
    els.map((el) => ({ area: el.getAttribute('data-area'), top: el.getBoundingClientRect().top })).sort((a, b) => a.top - b.top)[0].area,
  )
  expect(first).toBe('ai')

  await page.getByRole('button', { name: /AI & Agents/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-face', 'neutral')
})

test('links without a target never render as live anchors', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('a[href="#"]')).toHaveCount(0)
  await expect(page.locator('.pending-link')).toHaveCount(4)
})
