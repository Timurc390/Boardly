/// <reference types="node" />
import { test } from '@playwright/test';

const navigationWaitUntil: 'load' | 'domcontentloaded' =
  process.env.BROWSERSTACK_USERNAME ? 'load' : 'domcontentloaded';

test.describe.parallel('browserstack parallel warmup', () => {
  test.skip(
    !process.env.BROWSERSTACK_PARALLEL_RUN,
    'Parallel warmup runs only for BrowserStack checklist.'
  );

  test('open home', async ({ page }) => {
    await page.goto('/', { waitUntil: navigationWaitUntil });
  });
});
