/// <reference types="node" />
import { test, Page, TestInfo } from '@playwright/test';

// BrowserStack iOS sessions expect "load" for waitUntil.
const navigationWaitUntil: 'load' | 'domcontentloaded' =
  process.env.BROWSERSTACK_USERNAME ? 'load' : 'domcontentloaded';

const waitForSelectorSafe = async (page: Page, selector: string, timeout = 15000) => {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch {
    // Ignore if the selector does not appear.
  }
};

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

const loginIfPossible = async (page: Page) => {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  await page.goto('/auth', { waitUntil: navigationWaitUntil });

  let hasPasswordInput = await hasSelector(page, 'input[type="password"]');
  if (!hasPasswordInput) {
    await page.goto('/', { waitUntil: navigationWaitUntil });
    hasPasswordInput = await hasSelector(page, 'input[type="password"]');
  }

  if (!hasPasswordInput) {
    return page.url().includes('/board');
  }

  if (!username || !password) {
    return false;
  }

  const passwordInput = page.locator('input[type="password"]').first();
  const userInput = page.locator('input[type="text"]').first();
  await userInput.fill(username);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"]').first().click();

  try {
    await page.waitForURL('**/board**', { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
};

test('mobile UI smoke', async ({ page }, testInfo) => {
  const boardId = process.env.TEST_BOARD_ID;
  const isLoggedIn = await loginIfPossible(page);

  if (!isLoggedIn) {
    await takeShot(page, testInfo, 'auth');
    return;
  }

  const boardPath = boardId ? `/board?board=${boardId}` : '/board';
  await page.goto(boardPath, { waitUntil: navigationWaitUntil });
  await waitForSelectorSafe(page, '.board-toolbar');
  await takeShot(page, testInfo, 'board');

  if (await hasSelector(page, '.board-selector-button')) {
    await page.locator('.board-selector-button').first().click();
    await waitForSelectorSafe(page, '.board-picker-modal');
    await takeShot(page, testInfo, 'board-picker');
    await page.keyboard.press('Escape');
  }

  await page.goto('/my-cards', { waitUntil: navigationWaitUntil });
  await waitForSelectorSafe(page, '.mycards-page');
  await takeShot(page, testInfo, 'my-cards');

  await page.goto('/profile', { waitUntil: navigationWaitUntil });
  await waitForSelectorSafe(page, '.profile-page');
  await takeShot(page, testInfo, 'profile');

  await page.goto('/faq', { waitUntil: navigationWaitUntil });
  await waitForSelectorSafe(page, '.content-page');
  await takeShot(page, testInfo, 'faq');
});
