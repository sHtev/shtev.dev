import { test, expect } from '@playwright/test';

const prompt = '[data-prompt]';

test('keyboardWorksWithoutClick', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/case-studies/');
  await expect(page.locator(prompt)).toHaveText('ls case-studies/');
});

test('choosingTypesCommandIntoPrompt', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('1');
  await expect(page.locator(prompt)).toHaveText('cat about.md');
  await expect(page).toHaveURL('/about/');
});

test('escGoesBack', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('navigation', { name: 'menu' })).toBeVisible();
});

test('deepLinkShowsCommand', async ({ page }) => {
  await page.goto('/case-studies/perspective/');
  await expect(page.locator(prompt)).toHaveText('cat case-studies/perspective.md');
  await expect(page.getByRole('navigation', { name: 'menu' })).toHaveCount(0);
});

test('browserBackReturnsToMenu', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('1');
  await expect(page).toHaveURL('/about/');
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('navigation', { name: 'menu' })).toBeVisible();
  // The prompt is rotating again: its text changes.
  const first = await page.locator(prompt).textContent();
  await expect(page.locator(prompt)).not.toHaveText(first ?? '', { timeout: 3000 });
});

test('menuWorksAfterReturningHome', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/');
  await page.keyboard.press('3');
  await expect(page).toHaveURL('/projects/');
});

test('noJsMenuIsLinks', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByRole('link', { name: '2. case studies' }).click();
  await expect(page).toHaveURL('/case-studies/');
  await expect(page.getByText('perspective')).toBeVisible();
  await ctx.close();
});

test('reducedMotionNoTyping', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/about/');
  const content = page.locator('[data-content]');
  const first = await content.textContent();
  await page.waitForTimeout(500);
  expect(await content.textContent()).toBe(first);
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/);
  await ctx.close();
});

test('noCursorOnContentPages', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('.prompt .cursor')).toHaveCount(0);
  await page.goto('/case-studies/');
  await expect(page.locator('.prompt .cursor')).toHaveCount(0);
});

test('cursorOnHomePage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.prompt .cursor')).toBeVisible();
});

test('nameInHeaderGoesHome', async ({ page }) => {
  await page.goto('/case-studies/raspberry-pi/');
  const home = page.getByRole('link', { name: 'STEVE GILROY' });
  expect(await home.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('none');
  await home.click();
  await expect(page).toHaveURL('/');
});
