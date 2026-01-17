/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const isBrowserStack = Boolean(process.env.BROWSERSTACK_USERNAME);

export default defineConfig({
  testDir: './tests',
  timeout: isBrowserStack ? 120000 : 60000,
  workers: isBrowserStack ? 1 : undefined,
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
