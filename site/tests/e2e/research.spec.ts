import { test, expect, type Page } from '@playwright/test';

const thesisTitle = 'Specifying the Ubiquitous User Interface Using Interaction Style';
const ijcaiTitle = 'A Brain-Computer Interface to a Plan-Based Narrative';
const thesisLink = (page: Page) => page.getByRole('link', { name: '[ thesis.pdf ]' });

// The default action is highlighted once the page has typed out.
async function typed(page: Page) {
  await expect(thesisLink(page)).toHaveClass(/sel/);
}

test('researchShowsCommand', async ({ page }) => {
  await page.goto('/research/');
  await expect(page.locator('[data-prompt]')).toHaveText('cat research.md');
});

test('phdFirst', async ({ page }) => {
  await page.goto('/research/');
  await typed(page);
  const content = page.locator('[data-content]');
  await expect(content.locator('h2').first()).toContainText('PhD');
  await expect(content).toContainText(thesisTitle);
  await expect(content).toContainText('Michael Harrison');
});

test('ijcaiFirstSelected', async ({ page }) => {
  await page.goto('/research/');
  await typed(page);
  const first = page.locator('[data-selected] li').first();
  await expect(first).toContainText(ijcaiTitle);
  await expect(first).toContainText('leading international AI conference');
});

test('fullListCollapsedWith29', async ({ page }) => {
  await page.goto('/research/');
  const details = page.locator('details');
  await expect(details.locator('summary')).toHaveText('All publications (29)');
  await expect(details).not.toHaveAttribute('open');
  await expect(details.locator('li')).toHaveCount(29);
});

test('steveBold', async ({ page }) => {
  await page.goto('/research/');
  await typed(page);
  const items = page.locator('[data-selected] li');
  const count = await items.count();
  expect(count).toBe(10);
  for (let i = 0; i < count; i++) {
    await expect(items.nth(i).locator('b', { hasText: /Gilroy/i })).toHaveCount(1);
  }
});

test('thesisDownload', async ({ page, request }) => {
  await page.goto('/research/');
  await typed(page);
  await expect(thesisLink(page)).toHaveAttribute('href', '/research/gilroy-phd-thesis.pdf');
  const pdf = await request.get('/research/gilroy-phd-thesis.pdf');
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
});

test('noLinkWithoutUrl', async ({ page }) => {
  await page.goto('/research/');
  await typed(page);
  const hrefs = await page.locator('[data-content] a, [data-selected] a, details a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href?.trim()).toBeTruthy();
  // The 2002 DIRC paper has no link: its title is plain text.
  await expect(page.locator('details li', { hasText: 'Develop User Interfaces for Multiple Devices' }).locator('a')).toHaveCount(0);
});

test('noOverflowAtPhoneWidth', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/research/');
  await typed(page);
  await page.locator('details summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('readableWithoutJs', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/research/');
  await expect(page.getByText(thesisTitle).first()).toBeVisible();
  await expect(page.locator('[data-selected]').getByText(ijcaiTitle)).toBeVisible();
  await expect(page.getByText('All publications (29)')).toBeVisible();
  await ctx.close();
});
