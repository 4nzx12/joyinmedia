import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager|google-analytics|\.mp4(?:\?|$)/, route => route.abort());
});

test('icon navigation reaches each section without outlining the focused section', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.locator('.nav-link')).toHaveCount(5);
  const shadow = await nav.evaluate(element => getComputedStyle(element).boxShadow);
  for (const [label, id] of [['Work', 'featured-work'], ['Services', 'services'], ['Results', 'faq'], ['Contact', 'contact'], ['Home', 'home']]) {
    const link = nav.getByRole('link', { name: label, exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const section = page.locator(`#${id}`);
    await expect(section).toBeFocused();
    await expect(section).toHaveCSS('outline-style', 'none');
    await expect(link).toHaveAttribute('aria-current', 'location');
    const bounds = await section.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(-1);
    expect(bounds.y).toBeLessThanOrEqual(112);
    await expect(nav).toHaveCSS('box-shadow', shadow);
  }
});

test('the icon dock fits narrow screens and supports both themes and keyboard focus', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const home = nav.getByRole('link', { name: 'Home', exact: true });
  await home.focus();
  await expect(home).toHaveCSS('outline-style', 'none');
  await expect(home.locator('.nav-tooltip')).toBeVisible();
  const initial = await nav.evaluate(element => getComputedStyle(element).backgroundColor);
  const theme = nav.getByRole('button', { name: 'Toggle dark mode' });
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(theme).toHaveAttribute('aria-pressed', 'true');
  expect(await nav.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(initial);
  const bounds = await nav.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(bounds.y).toBeLessThan(30);
  expect(bounds.height).toBeLessThan(80);
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('navigation scrolls through intermediate positions when motion is enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.__navScrollPositions = [];
    addEventListener('scroll', () => window.__navScrollPositions.push(scrollY), { passive: true });
  });
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Services', exact: true }).click();
  await expect.poll(() => page.locator('#services').evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(110);
  const positions = await page.evaluate(() => [...new Set(window.__navScrollPositions)]);
  expect(positions.length).toBeGreaterThan(3);
});
