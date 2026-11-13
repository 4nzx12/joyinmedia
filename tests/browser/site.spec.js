import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Do not send analytics or download large campaign videos during UI tests.
  // Aborted video requests also exercise the poster/error fallbacks.
  await page.route(/googletagmanager|google-analytics/, route => route.abort());
  await page.route(/\.mp4(?:\?|$)/, route => route.abort());
});

test('renders every section without hydration errors or horizontal overflow', async ({ page }, testInfo) => {
  const errors = [];
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /hydration|react|invalid.*prop/i.test(message.text())) errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Where Your Brand Takes Flight');
  expect(await page.locator('body').innerText()).not.toMatch(/[\u2733\u2197\u2192\u2190\u2191\u2193\u2212\u00D7]/);
  await expect(page.locator('.flight-star')).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(page.locator('.hero-art, .art-wordmark, .art-orbit, .hero canvas')).toHaveCount(0);
  await expect(page.locator('.hero-copy')).toHaveCSS('text-align', 'center');
  const heroBackground = await page.locator('.hero').evaluate(element => getComputedStyle(element).backgroundImage);
  expect(heroBackground).toContain('radial-gradient');
  expect(heroBackground).toContain('linear-gradient');
  for (const title of ['Business Strategy & Consulting', 'Brand & Marketing Growth', 'Sales & Revenue Solutions', 'Operations & Management', 'Technology & Digital Transformation']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
  for (const id of ['process', 'services', 'featured-work', 'faq', 'contact']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  const office = page.getByRole('link', { name: 'Office Joyin Media' });
  await expect(office).toHaveAttribute('href', 'https://maps.app.goo.gl/qiC4VHdL4EsD3Nyu9');
  await expect(office).toContainText('Pachalam, Kochi');
  const footer = page.locator('.site-footer');
  await expect(footer.locator('.footer-invitation')).toBeVisible();
  await expect(footer.getByRole('link', { name: /Start a project/ })).toHaveAttribute('href', 'mailto:joyinmediahouse@gmail.com');
  await expect(footer.locator('.footer-top, .footer-bottom')).toHaveCount(0);
  const footerLogo = footer.locator('.footer-logo');
  await expect(footerLogo).toHaveCount(1);
  await expect(footer.locator('.footer-logo-wrap a')).toHaveAttribute('href', '#top');
  const footerBounds = await footer.boundingBox();
  const footerLogoBounds = await footerLogo.boundingBox();
  expect(Math.abs(footerLogoBounds.x + footerLogoBounds.width / 2 - (footerBounds.x + footerBounds.width / 2))).toBeLessThan(1);
  await expect(page.getByText('Independent creative agency · Kochi, India')).toHaveCount(0);
  await expect(page.getByText('Good ideas deserve to be seen.')).toHaveCount(0);
  await expect(page.locator('#about')).toHaveCount(0);
  await expect(page.locator('.cs-card')).toHaveCount(7);
  await expect(page.locator('.project-caption')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Posters' })).toBeVisible();
  await expect(page.locator('.marquee-3d')).toHaveCount(1);
  const posterColumns = page.locator('.marquee-3d-plane > .component-marquee');
  await expect(posterColumns).toHaveCount(3);
  await expect(page.locator('.marquee-3d img')).toHaveCount(48);
  await expect(page.locator('.marquee-3d img[src^="https://res.cloudinary.com/dib15sbq/image/upload/"]')).toHaveCount(48);
  for (let column = 0; column < 3; column++) {
    const sources = await posterColumns.nth(column).locator('img').evaluateAll(images => [...new Set(images.map(image => image.getAttribute('src')))]);
    expect(sources).toHaveLength(8);
  }
  await expect(page.locator('.brand-marquee .component-marquee-track').first().locator('.t-logo')).toHaveCount(11);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  const themeBounds = await page.getByRole('button', { name: 'Toggle dark mode' }).boundingBox();
  expect(themeBounds.x).toBeGreaterThanOrEqual(0);
  expect(themeBounds.x + themeBounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  await page.screenshot({ path: testInfo.outputPath('home.png') });
  expect(errors).toEqual([]);
});

test('theme persists, package details toggle, and testimonials switch', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  const theme = page.getByRole('button', { name: 'Toggle dark mode' });
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(theme).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(9, 9, 9)');
  await page.reload();
  await expect(theme).toHaveAttribute('aria-pressed', 'true');
  const beginning = page.getByRole('button', { name: 'Choose Beginning package' });
  const target = page.getByRole('button', { name: 'Choose Target package' });
  await beginning.click();
  await expect(beginning).toHaveAttribute('aria-expanded', 'true');
  await target.click();
  await expect(beginning).toHaveAttribute('aria-expanded', 'false');
  await expect(target).toHaveAttribute('aria-expanded', 'true');
  await target.click();
  await expect(target).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Waiver', exact: true }).click();
  await expect(page.locator('.client-main-metric')).toHaveAttribute('aria-label', '1M+ Reach');
  await expect(page.locator('.testimonial-company')).toHaveText('Chauffeur Service');
});

test('theme colors and package details animate smoothly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => {
    window.__transitions = [];
    document.addEventListener('transitionrun', event => {
      if (event.propertyName === '--bg' || event.propertyName === 'grid-template-rows') window.__transitions.push(event.propertyName);
    }, true);
  });
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect.poll(() => page.evaluate(() => window.__transitions.includes('--bg'))).toBe(true);
  await page.getByRole('button', { name: 'Choose Beginning package' }).click();
  await expect.poll(() => page.evaluate(() => window.__transitions.includes('grid-template-rows'))).toBe(true);
});

test('testimonials automatically change every 3 seconds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#faq');
  const proof = page.locator('.proof-layout');
  const name = page.locator('.testimonial-name');
  await expect(proof).toHaveAttribute('aria-live', 'off');
  await page.getByRole('button', { name: 'Waiver', exact: true }).click();
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.mouse.move(0, 0);
  await expect(proof).toHaveAttribute('aria-live', 'off');
  const started = Date.now();
  await expect(name).toHaveText('BESIDE', { timeout: 4500 });
  const elapsed = Date.now() - started;
  expect(elapsed).toBeGreaterThanOrEqual(2500);
  expect(elapsed).toBeLessThan(4500);
});

test('carousel wraps, supports keyboard navigation, and restores focus after the modal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Previous project', exact: true }).click();
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Project 7 of 7');
  await page.getByRole('button', { name: 'Next project', exact: true }).click();
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Project 1 of 7');
  await page.locator('.cs-card.is-active').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Project 2 of 7');
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-label', 'Chai Girl — Brand Presentation');
  await expect(page.getByRole('button', { name: 'Close project' })).toBeFocused();
  await page.getByRole('button', { name: 'Next video' }).click();
  await expect(dialog).toHaveAttribute('aria-label', 'Boy and Friend — Social Content');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.cs-card.is-active')).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('form validates and prepares a WhatsApp draft without sending a message', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.open = (...args) => { window.__opened = args; return null; };
  });
  await page.goto('/#contact');
  await page.getByRole('button', { name: 'Send via WhatsApp', exact: true }).click();
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
  await expect(page.locator('#error-phone')).toHaveText('Please enter your phone number.');
  await page.getByLabel('Name', { exact: true }).fill('Asha & Team');
  await page.getByLabel('Phone', { exact: true }).fill('+91 98765 43210');
  await page.getByLabel('How can we help?', { exact: true }).fill('We need branding & video for our café.');
  await page.getByRole('button', { name: 'Send via WhatsApp', exact: true }).click();
  await expect(page.locator('#formSuccess')).toContainText('Complete sending it in WhatsApp');
  const opened = await page.evaluate(() => window.__opened);
  const url = new URL(opened[0]);
  expect(url.origin + url.pathname).toBe('https://wa.me/917736700496');
  expect(url.searchParams.get('text')).toContain('Asha & Team');
  expect(opened[2]).toBe('noopener,noreferrer');
});

test('dragging the carousel advances without accidentally opening a project', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#featured-work');
  const card = page.locator('.cs-card.is-active');
  await card.scrollIntoViewIfNeeded();
  const bounds = await card.boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Project 2 of 7');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('reduced motion stops marquees and automatic carousel movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#featured-work');
  await expect(page.locator('.video-bg')).toHaveCount(0);
  await expect(page.locator('.cs-vid')).toHaveCount(0);
  expect(await page.locator('.component-marquee-track').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  const progress = page.locator('#csProgress');
  await expect(progress).toHaveAttribute('aria-label', 'Project 1 of 7');
  await page.clock.install();
  await page.clock.fastForward(14000);
  await expect(progress).toHaveAttribute('aria-label', 'Project 1 of 7');
});

test('the hero fills the viewport width with its gradient and no artwork box', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.hero-art, .art-wordmark, .hero canvas')).toHaveCount(0);
  const heroBackground = await page.locator('.hero').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const background = getComputedStyle(element);
    return { image: background.backgroundImage, width: bounds.width, height: bounds.height };
  });
  expect(heroBackground.image).toContain('radial-gradient');
  expect(heroBackground.width).toBeCloseTo(page.viewportSize().width, 0);
  expect(heroBackground.height).toBeGreaterThan(600);
});

test('the poster marquee centers its middle column and keeps scrolling on hover', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const marquee = page.locator('.marquee-3d');
  await marquee.scrollIntoViewIfNeeded();
  const columns = marquee.locator('.marquee-3d-plane > .component-marquee');
  await expect(columns).toHaveCount(3);
  const marqueeBounds = await marquee.boundingBox();
  const middleBounds = await columns.nth(1).boundingBox();
  expect(Math.abs(middleBounds.x + middleBounds.width / 2 - (marqueeBounds.x + marqueeBounds.width / 2))).toBeLessThan(2);
  await columns.nth(1).hover();
  await expect.poll(() => columns.nth(1).locator('.component-marquee-track').first().evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
});

test('production HTML is readable with JavaScript disabled and keeps SEO files', async ({ browser, request }) => {
  test.skip(process.env.E2E_DEV === '1', 'Static HTML is emitted by the production build.');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'YOU TELL US' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Get in touch' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://joyinmediahouse.com/');
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: https://joyinmediahouse.com/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(await sitemap.text()).toContain('<loc>https://joyinmediahouse.com/</loc>');
  await context.close();
});
