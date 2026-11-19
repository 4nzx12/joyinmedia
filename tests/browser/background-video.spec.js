import { test, expect } from '@playwright/test';

const active = page => page.locator('.hero-background video[data-active="true"]');

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager|google-analytics|pxbzulmb\/video\/.*\.mp4/, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.__videoSeeks = [];
    window.__themeTimes = [];
    const time = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      ...time,
      set(value) {
        if (this.closest('.hero-background')) window.__videoSeeks.push({ theme: this.dataset.videoTheme, time: value });
        time.set.call(this, value);
      },
    });
    window.addEventListener('jm:before-theme-change', () => {
      const video = document.querySelector('.hero-background video[data-active="true"]');
      if (video) window.__themeTimes.push(video.currentTime);
    });
  });
});

test('both directions preserve the exact fractional timestamp and reuse the buffered players', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(active(page)).toHaveAttribute('data-video-theme', 'light');
  await page.waitForFunction(() => [...document.querySelectorAll('.hero-background video')].every(video => video.readyState >= 2));
  await page.evaluate(() => { window.__originalPlayers = [...document.querySelectorAll('.hero-background video')]; });
  for (const [time, theme] of [[3.5, 'dark'], [6.237, 'light'], [9.875, 'dark']]) {
    await active(page).evaluate((video, position) => { video.pause(); video.currentTime = position; }, time);
    await expect.poll(() => active(page).evaluate(video => video.seeking)).toBe(false);
    await page.getByRole('button', { name: 'Toggle dark mode' }).evaluate(button => button.click());
    await expect(active(page)).toHaveAttribute('data-video-theme', theme);
    const captured = await page.evaluate(() => window.__themeTimes.at(-1));
    const assigned = await page.evaluate(requested => window.__videoSeeks.filter(seek => seek.theme === requested).at(-1).time, theme);
    expect(captured).toBeCloseTo(time, 6);
    expect(assigned).toBeCloseTo(captured, 6);
    await expect.poll(() => active(page).evaluate(video => !video.paused && !video.seeking)).toBe(true);
    expect(await page.evaluate(() => window.__originalPlayers.every((video, index) => video === document.querySelectorAll('.hero-background video')[index]))).toBe(true);
  }
});

test('a delayed incoming video keeps the outgoing frame until the exact seek is ready', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(/\/media\/background-dark-.*\.mp4$/, async route => { await gate; await route.continue(); });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(active(page)).toHaveAttribute('data-video-theme', 'light');
    await active(page).evaluate(video => { video.pause(); video.currentTime = 3.5; });
    await expect.poll(() => active(page).evaluate(video => video.seeking)).toBe(false);
    await page.getByRole('button', { name: 'Toggle dark mode' }).evaluate(button => button.click());
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(active(page)).toHaveAttribute('data-video-theme', 'light');
    await expect.poll(() => active(page).evaluate(video => video.paused)).toBe(true);
    expect(await active(page).evaluate(video => video.currentTime)).toBeCloseTo(3.5, 6);
    release();
    await expect(active(page)).toHaveAttribute('data-video-theme', 'dark');
    expect(await page.evaluate(() => window.__videoSeeks.filter(seek => seek.theme === 'dark').at(-1).time)).toBeCloseTo(3.5, 6);
  } finally { release(); }
});

test('rapid toggles settle on the latest theme and preserve playback through visibility changes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(active(page)).toHaveCount(1);
  for (let index = 0; index < 7; index++) await page.getByRole('button', { name: 'Toggle dark mode' }).evaluate(button => button.click());
  await expect(active(page)).toHaveAttribute('data-video-theme', 'dark');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => active(page).evaluate(video => video.paused)).toBe(true);
  const time = await active(page).evaluate(video => video.currentTime);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => active(page).evaluate(video => !video.paused && video.currentTime > 0)).toBe(true);
  expect(await active(page).evaluate(video => video.currentTime)).toBeGreaterThanOrEqual(time);
  await page.locator('#services').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.hero-background video').evaluateAll(videos => videos.every(video => video.paused))).toBe(true);
  expect(errors).toEqual([]);
});

test('the production hero starts before React and survives hydration in either saved theme', async ({ page }, testInfo) => {
  test.skip(process.env.E2E_DEV === '1', 'Early startup uses the production pre-rendered markup.');
  const savedTheme = testInfo.project.name === 'mobile' ? 'dark' : 'light';
  await page.addInitScript(theme => localStorage.setItem('jm-theme', theme), savedTheme);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(/\/assets\/index-.*\.js$/, async route => { await gate; await route.continue(); });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /hydration|react/i.test(message.text())) errors.push(message.text()); });
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.querySelector('.hero-background video[data-active]')?.currentTime > .75);
    await expect(active(page)).toHaveAttribute('data-video-theme', savedTheme);
    const earlyTime = await active(page).evaluate(video => { window.__earlyPlayer = video; return video.currentTime; });
    release();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute('aria-pressed', String(savedTheme === 'dark'));
    expect(await active(page).evaluate(video => video === window.__earlyPlayer)).toBe(true);
    expect(await active(page).evaluate(video => video.currentTime)).toBeGreaterThanOrEqual(earlyTime);
    expect(errors).toEqual([]);
  } finally { release(); }
});

test('reduced motion and data saving prevent video downloads and show the selected poster', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (/\/media\/.*\.mp4/.test(request.url())) requests.push(request.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect(page.locator('.background-media video[src]')).toHaveCount(0);
  await expect(page.locator('.hero-background .video-poster--dark')).toHaveCSS('opacity', '1');
  expect(requests).toEqual([]);
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { configurable: true, value: Object.assign(new EventTarget(), { saveData: true }) }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.background-media video[src]')).toHaveCount(0);
  expect(requests).toEqual([]);
});
