import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Stray Animal Management E2E tests.
 *
 * Prerequisites:
 * 1. Start the API: cd apps/api && pnpm dev (runs on port 3001)
 * 2. Start the web app: cd apps/web && pnpm dev (runs on port 3000)
 *
 * Or use the webServer config below to start both automatically.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'th-TH',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Start both API and web servers before running tests */
  webServer: [
    {
      command: 'pnpm dev',
      cwd: '../api',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
