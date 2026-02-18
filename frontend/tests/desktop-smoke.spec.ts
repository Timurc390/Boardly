/// <reference types="node" />
import { expect, Page, test } from '@playwright/test';

const navigationWaitUntil: 'load' | 'domcontentloaded' =
  process.env.BROWSERSTACK_USERNAME ? 'load' : 'domcontentloaded';

const username = process.env.TEST_USERNAME || '';
const password = process.env.TEST_PASSWORD || '';
const boardReadySelector = '.board-list-page, .boards-hub-grid, a.board-card, button.create-board-card';

const isAuthUrl = (url: string) => {
  try {
    return new URL(url).pathname.startsWith('/auth');
  } catch {
    return url.includes('/auth');
  }
};

const isBoardsUrl = (url: string) => {
  try {
    return new URL(url).pathname.startsWith('/boards');
  } catch {
    return url.includes('/boards');
  }
};

const assertNoHorizontalOverflow = async (page: Page) => {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const maxWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
    return maxWidth > window.innerWidth + 1;
  });
  expect(hasOverflow).toBeFalsy();
};

const detectAuthOrBoardsState = async (page: Page): Promise<'auth' | 'boards' | 'unknown'> => {
  await Promise.race([
    page.waitForURL('**/auth', { timeout: 4000 }),
    page.waitForSelector('input[name="username"]', { state: 'visible', timeout: 4000 }),
    page.waitForSelector(boardReadySelector, { state: 'visible', timeout: 4000 }),
  ]).catch(() => undefined);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const url = page.url();
    const authVisible = await page.locator('input[name="username"]').first().isVisible().catch(() => false);
    const boardVisible = await page.locator(boardReadySelector).first().isVisible().catch(() => false);
    if (authVisible || isAuthUrl(url)) return 'auth';
    if (boardVisible && isBoardsUrl(url)) return 'boards';
    await page.waitForTimeout(250);
  }

  return 'unknown';
};

const ensureLoggedIn = async (page: Page) => {
  await page.goto('/boards', { waitUntil: navigationWaitUntil });
  await page.waitForLoadState('domcontentloaded');

  let state = await detectAuthOrBoardsState(page);
  const token = await page.evaluate(() => window.localStorage.getItem('authToken')).catch(() => null);
  if (state === 'boards' && token) return;

  if (state !== 'auth') {
    await page.goto('/auth', { waitUntil: navigationWaitUntil });
    state = await detectAuthOrBoardsState(page);
  }
  if (state !== 'auth') {
    throw new Error('Unable to resolve auth/boards state before desktop login.');
  }

  const usernameInput = page.locator('input[name="username"]').first();
  await expect(usernameInput).toBeVisible({ timeout: 30000 });
  await usernameInput.fill(username);
  await page.locator('input[name="current-password"], input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await expect(page.locator('.board-list-page, .boards-hub-grid, a.board-card, button.create-board-card').first()).toBeVisible({ timeout: 30000 });
};

test.describe('desktop smoke 1920', () => {
  test('public routes render without layout overflow', async ({ page }) => {
    await page.goto('/landing', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.landing-page')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto('/community', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.community-page')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto('/help', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.help-page')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto('/privacy-policy', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.privacy-policy-page')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('auth routes and protected pages open on desktop', async ({ page }) => {
    test.skip(!username || !password, 'TEST_USERNAME and TEST_PASSWORD are required for auth desktop smoke.');
    await ensureLoggedIn(page);

    await page.goto('/boards', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.boards-hub-grid, .board-list-page').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const firstBoard = page.locator('a.board-card').first();
    if (await firstBoard.count()) {
      await firstBoard.click();
      await expect(page.locator('.board-detail-page')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }

    await page.goto('/my-cards', { waitUntil: navigationWaitUntil });
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('.task-card, .loading-state, .error-state').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto('/profile?tab=profile', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.profile-grid')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto('/profile?tab=settings', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.settings-layout')).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.goto('/profile?tab=privacy', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.profile-privacy-layout')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
