import { test, expect } from '@playwright/test';

test('rendersHeaderAndPrompt', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('STEVE GILROY · platform / devops / ai')).toBeVisible();
  await expect(page.getByText('shtev@dev:~$')).toBeVisible();
});

test('footerIsStickyAndLinksGithub', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 300 });
  await page.goto('/');
  // Make the page taller than the viewport, then scroll to the middle.
  await page.evaluate(() => {
    const main = document.querySelector('main')!;
    main.insertAdjacentHTML('beforeend', '<div style="height:2000px"></div>');
    window.scrollTo(0, 1000);
  });
  const link = page.getByRole('link', { name: 'github.com/shtev' });
  await expect(link).toHaveAttribute('href', 'https://github.com/sHtev');
  await expect(link).toBeInViewport();
});

test('ligaturesOff', async ({ page }) => {
  await page.goto('/');
  const value = await page.evaluate(() => getComputedStyle(document.body).fontVariantLigatures);
  expect(value).toBe('none');
});

test('notFoundUsesTerminal', async ({ page }) => {
  await page.goto('/nope');
  await expect(page.getByText('command not found')).toBeVisible();
});

test('notFoundShowsPath', async ({ page }) => {
  await page.goto('/nonsense');
  await expect(page.locator('[data-prompt]')).toHaveText('cd /nonsense');
  await expect(page.locator('.content')).toHaveText('bash: /nonsense: command not found');
});

test('notFoundTreatsPathAsText', async ({ page }) => {
  // No encoded "/" here: astro preview rejects it (CloudFront doesn't).
  await page.goto('/%3Cimg%20src%3Dx%3E');
  await expect(page.locator('.content img')).toHaveCount(0);
  await expect(page.locator('.content')).toContainText('/<img src=x>');
});

test('noInlineScripts', async ({ request }) => {
  // CSP is script-src 'self': every script must be an external file.
  for (const path of ['/', '/nonsense']) {
    const html = await (await request.get(path)).text();
    const inline = [...html.matchAll(/<script\b[^>]*>/g)].filter((m) => !/\ssrc=/.test(m[0]));
    expect(inline, path).toEqual([]);
  }
});

test('notFoundTruncatesLongPath', async ({ page }) => {
  await page.goto('/' + 'a'.repeat(200));
  const text = await page.locator('[data-prompt]').textContent();
  expect(text!.length).toBeLessThanOrEqual('cd '.length + 60);
  expect(text!.endsWith('…')).toBe(true);
});

test('notFoundWithoutJsIsGeneric', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/nonsense');
  await expect(page.locator('.content')).toHaveText('bash: that-page/: command not found');
  await ctx.close();
});

test('cursorDoesNotBlink', async ({ page }) => {
  await page.goto('/');
  const anim = await page.locator('.prompt .cursor').evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe('none');
});

test('backComesBeforeGithubInTabOrder', async ({ page }) => {
  await page.goto('/about/');
  const order = await page.locator('footer a').allTextContents();
  expect(order.map((t) => t.trim())).toEqual(['[ back ]', 'github.com/shtev']);
  // Visually, GitHub stays on the left and [ back ] on the right.
  const back = (await page.getByRole('link', { name: '[ back ]' }).boundingBox())!;
  const github = (await page.getByRole('link', { name: 'github.com/shtev' }).boundingBox())!;
  expect(github.x).toBeLessThan(back.x);
});
