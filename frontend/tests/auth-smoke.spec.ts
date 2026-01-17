/// <reference types="node" />
import { test, Page, TestInfo } from '@playwright/test';

const navigationWaitUntil: 'load' | 'domcontentloaded' =
  process.env.BROWSERSTACK_USERNAME ? 'load' : 'domcontentloaded';

const hasSelector = async (page: Page, selector: string) => {
  try {
    const handle = await page.$(selector);
    if (handle) {
      await handle.dispose();
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const takeShot = async (page: Page, testInfo: TestInfo, name: string) => {
  const fileName = `${name.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()}.png`;
  await page.screenshot({ path: testInfo.outputPath(fileName), fullPage: false });
};

test('auth screen renders', async ({ page }, testInfo) => {
  await page.goto('/auth', { waitUntil: navigationWaitUntil });
  let hasPassword = await hasSelector(page, 'input[type="password"]');
  let hasBoardToolbar = await hasSelector(page, '.board-toolbar');

  if (!hasPassword && !hasBoardToolbar) {
    await page.goto('/', { waitUntil: navigationWaitUntil });
    hasPassword = await hasSelector(page, 'input[type="password"]');
    hasBoardToolbar = await hasSelector(page, '.board-toolbar');
  }

  if (!hasPassword && !hasBoardToolbar) {
    await takeShot(page, testInfo, 'auth-missing');
    return;
  }

  await takeShot(page, testInfo, 'auth');
});
