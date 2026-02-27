import { expect, test } from '@playwright/test';

test('visual baseline', async ({ page }) => {
  await page.setContent(`
    <main style="padding:24px;font-family:Inter,system-ui,sans-serif">
      <h1>AgentLens Visual Baseline</h1>
      <button id="run">Run</button>
    </main>
  `);

  await expect(page).toHaveScreenshot('visual-baseline.png');
});
