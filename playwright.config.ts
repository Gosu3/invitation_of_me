import { defineConfig, devices } from '@playwright/test';

// Visual regression for the invitation template. Runs against a production
// build in demo mode (Supabase env blanked) so screenshots never depend on live data.
const PORT = 3100;

export default defineConfig({
  testDir: './tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 90_000,
  expect: {
    timeout: 30_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0 },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    launchOptions: { args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', viewport: { width: 375, height: 812 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/thiep/tho-va-tham`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
