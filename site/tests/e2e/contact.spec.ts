import { test, expect } from '@playwright/test';

test('focusStartsInName', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.getByLabel('name:')).toBeFocused();
});

test('typingDigitsInFieldDoesNotNavigate', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.getByLabel('name:')).toBeFocused();
  await page.keyboard.type('2');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await expect(page).toHaveURL('/contact/');
});

test('jsFlowSendsMessage', async ({ page }) => {
  let posted: unknown;
  await page.route('**/api/contact', async (route) => {
    posted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/contact/');
  await expect(page.getByLabel('name:')).toBeFocused();
  await page.keyboard.type('Ada');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ada@example.com');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Hello there');
  await page.keyboard.press('Enter');
  await expect(page.getByText('send?')).toBeVisible();
  await page.keyboard.press('y');
  await expect(page.getByText('message sent ✓')).toBeVisible();
  await expect(page.getByLabel('name:')).toBeHidden();
  await expect(page.getByRole('link', { name: '[ back ]' })).toBeFocused();
  await expect(page.getByRole('link', { name: '[ back ]' })).toHaveClass(/sel/);
  expect(posted).toMatchObject({ name: 'Ada', email: 'ada@example.com', message: 'Hello there' });
});

test('noJsFormPostsAndShowsSent', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 303, headers: { Location: '/contact/sent/' } }),
  );
  await page.goto('/contact/');
  await page.getByLabel('name:').fill('Ada');
  await page.getByLabel('email:').fill('ada@example.com');
  await page.getByLabel('message:').fill('Hello');
  await page.getByRole('button', { name: '[ send ]' }).click();
  await expect(page).toHaveURL('/contact/sent/');
  await expect(page.getByText('message sent ✓')).toBeVisible();
  await ctx.close();
});

test('showsHelloAddress', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.getByRole('link', { name: 'hello@shtev.dev' })).toHaveAttribute('href', 'mailto:hello@shtev.dev');
});

test('confirmPromptNotHiddenBehindFooter', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 460 });
  await page.route('**/api/contact', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
  await page.goto('/contact/');
  await expect(page.getByLabel('name:')).toBeFocused();
  await page.keyboard.type('Ada');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ada@example.com');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Hello');
  await page.keyboard.press('Enter');
  const confirm = (await page.getByText('send?').boundingBox())!;
  const footer = (await page.locator('footer').boundingBox())!;
  expect(confirm.y + confirm.height).toBeLessThanOrEqual(footer.y);
});

test('buttonsOnlyFlowSendsMessage', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
  await page.goto('/contact/');
  await page.getByLabel('name:').fill('Ada');
  await page.getByRole('button', { name: '[ next ]' }).click();
  await page.getByLabel('email:').fill('ada@example.com');
  await page.getByRole('button', { name: '[ next ]' }).click();
  await page.getByLabel('message:').fill('Hello');
  await page.getByRole('button', { name: '[ next ]' }).click();
  await page.getByRole('button', { name: '[ yes ]' }).click();
  await expect(page.getByText('message sent ✓')).toBeVisible();
});

test('noPlainFormLink', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.getByRole('link', { name: '[ plain form ]' })).toHaveCount(0);
});
