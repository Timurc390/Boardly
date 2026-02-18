/// <reference types="node" />
import { expect, Locator, Page, test } from '@playwright/test';

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

const expectInViewport = async (page: Page, locator: Locator) => {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) return;
  const tolerance = 16;

  await expect
    .poll(async () => {
      const box = await locator.boundingBox();
      if (!box) return false;
      return (
        box.x >= -tolerance &&
        box.y >= -tolerance &&
        box.x + box.width <= viewport.width + tolerance &&
        box.y + box.height <= viewport.height + tolerance
      );
    }, { timeout: 5000 })
    .toBeTruthy();
};

const expectTopLayerAtCenter = async (page: Page, locator: Locator, selector: string) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const x = box.x + box.width / 2;
  const y = box.y + Math.min(box.height / 2, Math.max(1, box.height - 1));
  const isTopLayer = await page.evaluate(
    ({ pointX, pointY, expectedSelector }) => {
      const target = document.elementFromPoint(pointX, pointY);
      return !!target?.closest(expectedSelector);
    },
    { pointX: x, pointY: y, expectedSelector: selector }
  );

  expect(isTopLayer).toBeTruthy();
};

const detectAuthOrBoardsState = async (page: Page): Promise<'auth' | 'boards' | 'unknown'> => {
  await Promise.race([
    page.waitForURL('**/auth', { timeout: 4000 }),
    page.waitForSelector('input[name="username"]', { state: 'visible', timeout: 4000 }),
    page.waitForSelector(boardReadySelector, { state: 'visible', timeout: 4000 })
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
    throw new Error('Unable to resolve auth/boards state before login submit.');
  }

  const usernameInput = page.locator('input[name="username"]').first();
  await expect(usernameInput).toBeVisible({ timeout: 30000 });

  await usernameInput.fill(username);
  await page.locator('input[name="current-password"], input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  try {
    await Promise.race([
      page.waitForURL('**/boards', { timeout: 30000 }),
      page.waitForSelector('.board-list-page', { timeout: 30000 }),
      page.waitForSelector('.boards-hub-grid', { timeout: 30000 }),
      page.waitForSelector('a.board-card, button.create-board-card', { timeout: 30000 })
    ]);
    const postState = await detectAuthOrBoardsState(page);
    const stillOnLogin = postState === 'auth';
    if (stillOnLogin) {
      throw new Error('Login form is still visible after submit.');
    }
  } catch {
    let authError = '';
    try {
      const errorLocator = page.getByText(
        /no connection|incorrect|invalid|login failed|невір|помил|підключ/i
      ).first();
      if (await errorLocator.isVisible()) {
        authError = (await errorLocator.textContent())?.trim() || '';
      }
    } catch {
      // Keep default message when no explicit auth error is visible.
    }
    throw new Error(
      authError
        ? `Login did not redirect to /boards. Auth error: ${authError}`
        : 'Login did not redirect to /boards. Credentials are invalid or auth backend is unavailable.'
    );
  }
};

const ensureAtLeastOneBoard = async (page: Page) => {
  await page.waitForSelector('.board-list-page, .boards-hub-grid', { timeout: 30000 });

  const authUsernameInput = page.locator('input[name="username"]').first();
  if (
    isAuthUrl(page.url()) ||
    await authUsernameInput.isVisible().catch(() => false)
  ) {
    throw new Error('Cannot create/open board because user is not authenticated in smoke run.');
  }

  const firstBoardCard = page.locator('a.board-card').first();
  if (await firstBoardCard.count()) return;

  const createBoardCard = page.locator('button.create-board-card').first();
  await expect(createBoardCard).toBeVisible();
  await createBoardCard.click();

  const boardTitleInput = page.locator('.modal-content form input').first();
  await expect(boardTitleInput).toBeVisible();
  await boardTitleInput.fill(`Smoke board ${Date.now()}`);

  await page.locator('.modal-content .modal-footer button[type="submit"]').first().click();
  await expect(page.locator('a.board-card').first()).toBeVisible({ timeout: 30000 });
};

const ensureAtLeastOneList = async (page: Page) => {
  const listTrigger = page.locator('.list-menu-trigger');
  if (await listTrigger.count()) return;

  const addListBtn = page.locator('.btn-add-list').first();
  await expect(addListBtn).toBeVisible();
  await addListBtn.click();
  const listTitleInput = page.locator('input[name="listTitle"]').first();
  await listTitleInput.fill('Smoke list');
  await page.locator('.add-list-wrapper form button[type="submit"]').first().click();
  await expect(page.locator('.list-menu-trigger').first()).toBeVisible();
};

const ensureAtLeastOneCard = async (page: Page) => {
  const firstCard = page.locator('.task-card');
  if (await firstCard.count()) return;

  const addCardBtn = page.locator('.add-card-wrapper .btn-ghost').first();
  await addCardBtn.click();
  const cardTitleInput = page.locator('input[enterkeyhint="done"]').first();
  await cardTitleInput.fill('Smoke card');
  await page.locator('.add-card-wrapper button[type="submit"]').first().click();
  await expect(page.locator('.task-card').first()).toBeVisible();
};

test.describe('mobile board smoke', () => {
  test.skip(!username || !password, 'TEST_USERNAME and TEST_PASSWORD are required for smoke login.');

  test('list/card/profile/settings/privacy flows do not regress on mobile', async ({ page }) => {
    await ensureLoggedIn(page);
    await ensureAtLeastOneBoard(page);

    const boardCard = page.locator('a.board-card').first();
    await expect(boardCard).toBeVisible({ timeout: 30000 });
    await boardCard.click();
    await page.waitForURL('**/boards/*', { timeout: 30000 });
    await expect(page.locator('.board-detail-page')).toBeVisible();

    await ensureAtLeastOneList(page);
    await ensureAtLeastOneCard(page);

    const globalMenuTrigger = page.locator('.board-global-menu-trigger').first();
    if (await globalMenuTrigger.count()) {
      await globalMenuTrigger.click();
      const globalMenu = page.locator('.board-global-menu-dropdown').first();
      await expect(globalMenu).toBeVisible();
      await expectInViewport(page, globalMenu);
      await expectTopLayerAtCenter(page, globalMenu, '.board-global-menu-dropdown');
      const globalOverlay = page.locator('.board-global-menu-overlay').first();
      await globalOverlay.click();
      await expect(globalMenu).toBeHidden();
    }

    const memberTrigger = page.locator('.board-member-trigger').first();
    if (await memberTrigger.isVisible().catch(() => false)) {
      await memberTrigger.click();
      const memberPopover = page.locator('.board-member-popover').first();
      await expect(memberPopover).toBeVisible();
      await expectInViewport(page, memberPopover);
      await expectTopLayerAtCenter(page, memberPopover, '.board-member-popover');

      const membersPanelTrigger = page.locator('.board-members-panel-trigger').first();
      if (await membersPanelTrigger.isVisible().catch(() => false)) {
        await membersPanelTrigger.click();
        const membersPanel = page.locator('.board-members-panel').first();
        await expect(membersPanel).toBeVisible();
        await expect(page.locator('.board-member-popover')).toHaveCount(0);
        await expectInViewport(page, membersPanel);
        await expectTopLayerAtCenter(page, membersPanel, '.board-members-panel');
      }
    }

    const listMenuTrigger = page.locator('.list-menu-trigger').first();
    await listMenuTrigger.click();
    const listMenu = page.locator('.list-menu-dropdown').first();
    await expect(listMenu).toBeVisible();
    await expectInViewport(page, listMenu);
    await expectTopLayerAtCenter(page, listMenu, '.list-menu-dropdown');
    await expect(page.locator('.board-global-menu-overlay')).toHaveCount(0);
    await listMenu.locator('.list-menu-close').click();
    await expect(listMenu).toBeHidden();

    const boardActionsTrigger = page.locator('.board-account-trigger').first();
    if (await boardActionsTrigger.count()) {
      await boardActionsTrigger.click();
      const sidebar = page.locator('.menu-sidebar').last();
      await expect(sidebar).toBeVisible();
      await expectInViewport(page, sidebar);
      await expectTopLayerAtCenter(page, sidebar, '.menu-sidebar');
      await expect(page.locator('.list-menu-dropdown')).toHaveCount(0);
      await sidebar.locator('.menu-header .btn-icon[aria-label]').last().click();
      await expect(sidebar).toBeHidden();
    }

    await page.locator('.task-card').first().click();
    await expect(page.locator('.card-modal-overlay')).toBeVisible();

    const cardMenuTrigger = page.locator('.card-menu-trigger').first();
    await cardMenuTrigger.click();
    const cardMenu = page.locator('.card-menu-dropdown').first();
    await expect(cardMenu).toBeVisible();
    await expectInViewport(page, cardMenu);
    await expectTopLayerAtCenter(page, cardMenu, '.card-menu-dropdown');
    await cardMenuTrigger.click();
    await expect(page.locator('.card-menu-dropdown')).toHaveCount(0);

    const quickAddButton = page.locator('.card-quick-btn').first();
    await quickAddButton.click();
    const addPopover = page.locator('.card-add-popover').first();
    await expect(addPopover).toBeVisible();
    await expectInViewport(page, addPopover);
    await expectTopLayerAtCenter(page, addPopover, '.card-add-popover');

    const commentsLaunch = page.locator('.card-comments-launch').first();
    await commentsLaunch.click();
    await expect(page.locator('.card-comments-col')).toBeVisible();
    await expect(page.locator('.card-add-popover')).toHaveCount(0);

    const commentsClose = page.locator('.card-comments-close').first();
    if (await commentsClose.count()) {
      await commentsClose.click();
      await expect(page.locator('.card-comments-col')).toHaveCount(0);
    }

    await page.keyboard.press('Escape');
    await expect(page.locator('.card-modal-overlay')).toHaveCount(0);

    await page.goto('/profile?tab=profile', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.profile-grid')).toBeVisible();

    await page.goto('/profile?tab=settings', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.settings-layout')).toBeVisible();

    await page.goto('/profile?tab=privacy', { waitUntil: navigationWaitUntil });
    await expect(page.locator('.profile-privacy-layout')).toBeVisible();
    await expect(page.locator('.privacy-text-block').first()).toBeVisible();
  });
});
