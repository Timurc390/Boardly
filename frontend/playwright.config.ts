/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const isBrowserStack = Boolean(process.env.BROWSERSTACK_USERNAME);
const bsWorkersEnv = Number(process.env.BROWSERSTACK_PARALLEL_WORKERS);
const bsWorkers =
  Number.isFinite(bsWorkersEnv) && bsWorkersEnv > 0 ? bsWorkersEnv : 1;
const browserStackWorkers = process.env.BROWSERSTACK_PARALLEL_RUN ? bsWorkers : 1;

export default defineConfig({
  testDir: './tests',
  timeout: isBrowserStack ? 120000 : 60000,
  workers: isBrowserStack ? browserStackWorkers : undefined,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false
  },
  projects: [
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
    { name: 'Pixel 5', use: { ...devices['Pixel 5'] } }
  ]
});
