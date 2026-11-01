import { test, expect } from '@playwright/test';

const firstItemSelected = (page: import('@playwright/test').Page) =>
  expect(page.locator('[data-ls] .item').first()).toHaveClass(/sel/);

test('listsCaseStudiesInOrder', async ({ page }) => {
  await page.goto('/case-studies/');
  await firstItemSelected(page);
  const names = await page.locator('[data-ls] .item .name').allTextContents();
  expect(names.map((n) => n.trim())).toEqual(['perspective/', 'REDACTED/', 'REDACTED/', 'REDACTED-pipelines/']);
});

test('listKeyboardOpensDetail', async ({ page }) => {
  await page.goto('/case-studies/');
  await firstItemSelected(page);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-prompt]')).toHaveText('cat case-studies/REDACTED.md');
  await expect(page).toHaveURL('/case-studies/REDACTED/');
});

test('listEscGoesHome', async ({ page }) => {
  await page.goto('/projects/');
  await firstItemSelected(page);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/');
});

test('detailBackReturnsToList', async ({ page }) => {
  await page.goto('/projects/dotfiles/');
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/projects/');
});

test('projectExternalLink', async ({ page }) => {
  await page.goto('/projects/comics-tracker/');
  await expect(page.locator('a[href="https://spidey.comics-tracker.online"]')).toBeVisible();
});

test('tabMovesHighlightToBack', async ({ page }) => {
  await page.goto('/case-studies/');
  await firstItemSelected(page);
  const back = page.getByRole('link', { name: '[ back ]' });
  for (let i = 0; i < 10 && !(await back.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(back).toBeFocused();
  await expect(back).toHaveClass(/sel/);
  await expect(page.locator('[data-ls] .item.sel')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
});
