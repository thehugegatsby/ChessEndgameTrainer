import { defineConfig, devices } from '@playwright/test';
import { APP_CONFIG } from '../constants';
import { env } from '../env';

export default defineConfig({
  testDir: '../../tests/e2e',
  fullyParallel: true,
  forbidOnly: env.CI,
  retries: env.CI ? 2 : 0,
  workers: env.CI ? 1 : 4,
  reporter: 'list',
  use: {
    baseURL: APP_CONFIG.DEV_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
