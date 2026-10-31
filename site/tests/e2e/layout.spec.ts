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
