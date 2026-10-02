import { expect, test, type Page } from '@playwright/test';

// Baseline screenshots of the invitation in demo mode. Any CSS change that moves
// a pixel fails here; refresh baselines only after confirming the change is intended:
//   npm run test:visual:update
const SLUG = '/thiep/tho-va-tham';
const FROZEN_NOW = new Date('2026-10-01T09:00:00+07:00');

async function prepare(page: Page) {
  // Fake timers: fixed countdown, no carousel autoplay / polling between shots.
  await page.clock.install({ time: FROZEN_NOW });
  await page.clock.pauseAt(new Date(FROZEN_NOW.getTime() + 1000));
  // Keep shots offline-deterministic (Google Maps embed, etc.).
  await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
  await page.goto(SLUG);
  await page.evaluate(() => document.fonts.ready);
}

async function settle(page: Page) {
  await page.clock.runFor(50);
  await page.evaluate(() => document.fonts.ready);
  // Interval polling: the default rAF polling never fires under the fake clock.
  // Hidden lazy images (e.g. the flower-burst petals) never load, so skip zero-size ones.
  await page.waitForFunction(() => [...document.images].every((img) => {
    const rect = img.getBoundingClientRect();
    return img.complete || rect.width === 0 || rect.top > window.innerHeight * 2;
  }), undefined, { polling: 100 });
}

async function openInvitation(page: Page) {
  await prepare(page);
  await page.getByRole('button', { name: 'Mở thiệp' }).click();
  await page.locator('.invitation-content.is-opened').waitFor();
  // Scroll through once so every lazy image and reveal-on-scroll section is loaded.
  // (rAF is faked by page.clock, so step from the test side instead of in-page.)
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = (page.viewportSize()?.height ?? 800) / 2;
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.clock.runFor(20);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.clock.runFor(50);
  await settle(page);
}

const mask = (page: Page) => [page.locator('iframe')];

test('bìa thiệp (chưa mở)', async ({ page }) => {
  await prepare(page);
  await settle(page);
  await expect(page).toHaveScreenshot('cover.png');
});

test('toàn bộ thiệp sau khi mở', async ({ page }) => {
  await openInvitation(page);
  await expect(page).toHaveScreenshot('opened-full.png', { fullPage: true, mask: mask(page) });
});

for (const [name, selector] of [
  ['hero', '#bia-thiep'],
  ['le-cuoi', '#le-cuoi'],
  ['album', '#album'],
  ['tiec-cuoi', '#thoi-gian'],
  ['dia-diem', '#dia-diem'],
  ['lich-trinh', '.timeline-section'],
  ['so-luu-but', '#so-luu-but'],
  ['qua-mung', '#qua-mung'],
] as const) {
  test(`section ${name}`, async ({ page }) => {
    await openInvitation(page);
    const section = page.locator(selector).first();
    await section.scrollIntoViewIfNeeded();
    await settle(page);
    await expect(section).toHaveScreenshot(`section-${name}.png`, { mask: mask(page) });
  });
}

test('popup hộp quà', async ({ page }) => {
  await openInvitation(page);
  await page.getByRole('button', { name: 'Mở hộp quà mừng' }).first().click();
  await page.locator('.gift-modal-heading').waitFor();
  await settle(page);
  await expect(page).toHaveScreenshot('gift-modal.png');
});

test('lightbox album', async ({ page }) => {
  await openInvitation(page);
  await page.locator('#album').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Mở ảnh 1' }).click();
  await page.locator('.lightbox-stage').waitFor();
  await settle(page);
  await expect(page).toHaveScreenshot('lightbox.png');
});
