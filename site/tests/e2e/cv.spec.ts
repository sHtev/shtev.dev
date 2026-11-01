import { test, expect } from '@playwright/test';

test('cvActionsDefaultDownload', async ({ page }) => {
  await page.goto('/cv/');
  const download = page.getByRole('link', { name: '[ download cv.pdf ]' });
  await expect(download).toHaveClass(/sel/);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/);
  await expect(download).not.toHaveClass(/sel/);
});

test('cvDownloadLink', async ({ page, request }) => {
  await page.goto('/cv/');
  const download = page.getByRole('link', { name: '[ download cv.pdf ]' });
  await expect(download).toHaveAttribute('href', '/cv.pdf');
  await expect(download).toHaveAttribute('download', '');
  const pdf = await request.get('/cv.pdf');
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
});

test('cvScrollsWithStickyFooter', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 400 });
  await page.goto('/cv/');
  await expect(page.getByRole('link', { name: '[ download cv.pdf ]' })).toHaveClass(/sel/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole('link', { name: '[ download cv.pdf ]' })).toBeInViewport();
  await expect(page.getByRole('link', { name: '[ back ]' })).toBeInViewport();
});

test('cvRoleTitleOnItsOwnLine', async ({ page }) => {
  await page.goto('/cv/');
  await expect(page.getByRole('link', { name: '[ download cv.pdf ]' })).toHaveClass(/sel/);
  // Each "years · role, company" line ends in a line break before its description.
  const html = await page.locator('[data-content]').innerHTML();
  for (const role of ['Senior DevOps Engineer, Isotoma', 'Senior Software Engineer, Raspberry Pi Foundation', 'Lead Developer, Isotoma']) {
    expect(html, role).toMatch(new RegExp(`${role}\\s*<br>`));
  }
});
