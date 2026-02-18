/// <reference types="node" />
import { expect, Page, test } from '@playwright/test';

const navigationWaitUntil: 'load' | 'domcontentloaded' =
  process.env.BROWSERSTACK_USERNAME ? 'load' : 'domcontentloaded';

const expectNoHorizontalOverflow = async (page: Page) => {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const maxWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
    return maxWidth > window.innerWidth + 1;
  });
  expect(hasOverflow).toBeFalsy();
};

const assertPublicPage = async (
  page: Page,
  path: string,
  rootSelector: string,
  smokeSelector: string
) => {
  await page.goto(path, { waitUntil: navigationWaitUntil });
  await expect(page.locator(rootSelector)).toBeVisible();
  await expect(page.locator(smokeSelector).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(120);
  await expectNoHorizontalOverflow(page);
};

test.describe('public mobile pages smoke', () => {
  test('help/community/privacy stay responsive on mobile', async ({ page }) => {
    await assertPublicPage(page, '/help', '.help-page', '.help-shell');
    await assertPublicPage(page, '/community', '.community-page', '.community-rd-container');
    await assertPublicPage(page, '/privacy-policy', '.privacy-policy-page', '.privacy-policy-layout');
  });
});

