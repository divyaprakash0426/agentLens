import { expect, test } from '@playwright/test';

test('demo markup is present', async ({ page }) => {
  await page.setContent(`
    <button id="test-button">Test</button>
    <div id="click-result"></div>
  `);

  await expect(page.locator('#test-button')).toBeVisible();
});
