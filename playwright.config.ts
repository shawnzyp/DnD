import { defineConfig, devices } from '@playwright/test';

const mobileThumbProfile = {
  ...devices['iPhone 13 Pro'],
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'mobile-thumb',
      use: mobileThumbProfile,
    },
  ],
});
