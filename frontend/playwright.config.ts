/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const isBrowserStack = Boolean(process.env.BROWSERSTACK_USERNAME);
const hasAuthSmokeCreds = Boolean(process.env.TEST_USERNAME && process.env.TEST_PASSWORD);
const bsWorkersEnv = Number(process.env.BROWSERSTACK_PARALLEL_WORKERS);
const bsWorkers =
  Number.isFinite(bsWorkersEnv) && bsWorkersEnv > 0 ? bsWorkersEnv : 1;
const browserStackWorkers = process.env.BROWSERSTACK_PARALLEL_RUN ? bsWorkers : 1;
const testMatch = process.env.BROWSERSTACK_PARALLEL_RUN
  ? ['**/bs-parallel.spec.ts']
  : undefined;
const projects = process.env.BROWSERSTACK_PARALLEL_RUN
  ? [{ name: 'browserstack' }]
  : [
      {
        name: 'viewport-390x844',
        testMatch: ['**/public-mobile-pages.spec.ts', '**/mobile-ui.spec.ts'],
        use: {
          ...devices['iPhone 13'],
          viewport: { width: 390, height: 844 }
        }
      },
      {
        name: 'android-pixel-5',
        testMatch: ['**/public-mobile-pages.spec.ts', '**/mobile-ui.spec.ts'],
        use: { ...devices['Pixel 5'] }
      },
      {
        name: 'desktop-1920',
        testMatch: ['**/desktop-smoke.spec.ts', '**/auth-smoke.spec.ts'],
        use: {
          ...devices['Desktop Chrome'],
          viewport: { width: 1920, height: 1080 }
        }
      }
    ];

export default defineConfig({
  testDir: './tests',
  timeout: isBrowserStack ? 120000 : 60000,
  workers: isBrowserStack ? browserStackWorkers : (hasAuthSmokeCreds ? 1 : undefined),
  testMatch,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false
  },
  webServer: isBrowserStack
    ? undefined
    : {
        command: 'npm start',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120000
      },
  projects
});
