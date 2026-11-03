import { test, expect } from '@playwright/test';

const label = 'ASCII-art portrait of Steve Gilroy';

test('portraitInsetWide', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.goto('/about/');
  const panel = page.getByRole('img', { name: label });
  await expect(panel).toBeVisible();
  await expect(page.getByText('portrait.txt')).toBeVisible();
  // Top-right of the screen.
  const box = (await panel.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(1200 - 60);
  expect(box.y).toBeLessThan(80);
  const font = await page.locator('[data-portrait] pre').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font).toContain('VT323');
});

test('portraitBelowTextNarrow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/about/');
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/); // typing finished
  const panel = page.getByRole('img', { name: label });
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  const text = (await page.locator('[data-content]').boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(text.y + text.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('portraitDoesNotCoverText', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.goto('/about/');
  const panel = (await page.getByRole('img', { name: label }).boundingBox())!;
  const text = (await page.locator('[data-content]').boundingBox())!;
  expect(text.x + text.width).toBeLessThanOrEqual(panel.x);
});

test('portraitDoesNotJumpWhileTextTypes', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 420 });
  await page.goto('/about/');
  const panel = page.getByRole('img', { name: label });
  const before = (await panel.boundingBox())!;
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/); // typing finished
  const after = (await panel.boundingBox())!;
  expect(after.y).toBe(before.y);
  expect(after.x).toBe(before.x);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
