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

test('portraitHiddenNarrow', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto('/about/');
  await expect(page.getByRole('img', { name: label })).toBeHidden();
});

test('portraitDoesNotCoverText', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.goto('/about/');
  const panel = (await page.getByRole('img', { name: label }).boundingBox())!;
  const text = (await page.locator('[data-content]').boundingBox())!;
  expect(text.x + text.width).toBeLessThanOrEqual(panel.x);
});
