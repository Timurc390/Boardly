/// <reference types="node" />
import { test } from '@playwright/test';

const navigationWaitUntil: 'load' | 'domcontentloaded' =
  process.env.BROWSERSTACK_USERNAME ? 'load' : 'domcontentloaded';

test.describe.parallel('browserstack parallel warmup', () => {
  test.skip(
    !process.env.BROWSERSTACK_PARALLEL_RUN,
    'Parallel warmup runs only for BrowserStack checklist.'
  );

  const paths = [
    { name: 'home', path: '/' },
    { name: 'auth', path: '/auth' },
    { name: 'board', path: '/board' },
    { name: 'my-cards', path: '/my-cards' },
    { name: 'profile', path: '/profile' },
    { name: 'faq', path: '/faq' }
  ];

  for (const { name, path } of paths) {
    test(`open ${name}`, async ({ page }) => {
      await page.goto(path, { waitUntil: navigationWaitUntil });
    });
  }
});
