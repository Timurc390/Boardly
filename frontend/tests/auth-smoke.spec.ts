/// <reference types="node" />
import { expect, test } from '@playwright/test';

const navigationWaitUntil: 'load' | 'domcontentloaded' =
  process.env.BROWSERSTACK_USERNAME ? 'load' : 'domcontentloaded';

test('auth route is usable', async ({ page }) => {
  await page.goto('/auth', { waitUntil: navigationWaitUntil });

  const passwordInput = page.locator('input[name="current-password"], input[type="password"]').first();
  const boardRoot = page.locator('.board-list-page, .boards-hub-grid, .board-detail-page').first();

  const authVisible = await passwordInput.isVisible().catch(() => false);
  if (authVisible) {
    await expect(page.locator('input[name="username"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    return;
  }

  await expect(boardRoot).toBeVisible({ timeout: 30000 });
});
