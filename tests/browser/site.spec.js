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
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Where Your Brand Takes Flight');
  expect(await page.locator('body').innerText()).not.toMatch(/[\u2733\u2197\u2192\u2190\u2191\u2193\u2212\u00D7]/);
  await expect(page.locator('.flight-star')).toHaveAttribute('viewBox', '0 0 24 24');
  const heroEmMetrics = await page.locator('.hero-title-light').evaluate(element => {
    const style = getComputedStyle(element);
    return { lineHeight: parseFloat(style.lineHeight), fontSize: parseFloat(style.fontSize) };
  });

  expect(heroEmMetrics.lineHeight / heroEmMetrics.fontSize).toBeCloseTo(1.2);
  await expect(page.locator('.hero-art, .art-wordmark, .art-orbit')).toHaveCount(0);
  await expect(page.locator('.hero-copy')).toHaveCSS('text-align', 'center');
  await expect(page.locator('.hero')).toHaveCSS('background-color', 'rgb(246, 244, 238)');
  await expect(page.locator('.hero-background')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.hero canvas, .site-footer canvas')).toHaveCount(0);
  await expect(page.locator('.hero-copy')).toHaveCSS('color', 'rgb(37, 37, 31)');
  const footerBackground = await page.locator('.footer-background').evaluate(element => getComputedStyle(element).backgroundImage);
  expect(footerBackground).toContain('radial-gradient');
  await expect(page.locator('.footer-background')).toHaveCount(1);
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
  await expect(page.locator('.cs-card')).toHaveCount(4);
  await expect(page.locator('.project-caption')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Posters' })).toBeVisible();
  await expect(page.locator('.marquee-3d')).toHaveCount(1);
  const posterRows = page.locator('.marquee-3d-plane > .component-marquee');
  await expect(posterRows).toHaveCount(2);
  await expect(page.locator('.marquee-3d img')).toHaveCount(32);
  await expect(page.locator('.marquee-3d img[src^="https://res.cloudinary.com/dib15sbq/image/upload/"]')).toHaveCount(32);
  for (let row = 0; row < 2; row++) {
    const sources = await posterRows.nth(row).locator('img').evaluateAll(images => [...new Set(images.map(image => image.getAttribute('src')))]);
    expect(sources).toHaveLength(8);
  }
  await expect(page.locator('.brand-marquee .component-marquee-track').first().locator('.t-logo')).toHaveCount(15);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  const themeBounds = await page.getByRole('button', { name: 'Toggle dark mode' }).boundingBox();
  expect(themeBounds.x).toBeGreaterThanOrEqual(0);
  expect(themeBounds.x + themeBounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  await page.screenshot({ path: testInfo.outputPath('home.png') });
  expect(errors).toEqual([]);
});

test('mobile layout uses compact controls and even section spacing without changing desktop', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const layout = await page.evaluate(() => {
    const button = document.querySelector('.hero-cta .liquid-button');
    const section = document.querySelector('.content > section');
    return {
      buttonHeight: parseFloat(getComputedStyle(button).minHeight),
      buttonPaddingTop: parseFloat(getComputedStyle(button).paddingTop),
      sectionPadding: parseFloat(getComputedStyle(section).paddingTop),
    };
  });

  if (testInfo.project.name === 'mobile') {
    expect(layout).toEqual({ buttonHeight: 44, buttonPaddingTop: 10, sectionPadding: 64 });
  } else {
    expect(layout).toEqual({ buttonHeight: 48, buttonPaddingTop: 13, sectionPadding: 110 });
  }
});

test('theme persists, package details toggle, and testimonials switch', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const theme = page.getByRole('button', { name: 'Toggle dark mode' });
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(theme).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(9, 9, 9)');
  await page.reload({ waitUntil: 'domcontentloaded' });
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
  await page.goto('/', { waitUntil: 'domcontentloaded' });
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
  await page.goto('/#faq', { waitUntil: 'domcontentloaded' });
  const proof = page.locator('.proof-layout');
  const name = page.locator('.testimonial-name');
  // A hash navigation may focus the section or finish before layout settles.
  await proof.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.mouse.move(0, 0);
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

test('category carousel wraps, supports keyboard navigation, and restores focus after the modal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.cs-category-title')).toHaveText(['Presentation', 'Preparation', 'Story Skits', 'Fast Cuts']);
  await expect(page.locator('.cs-category-cover img')).toHaveCount(4);
  await expect(page.locator('.cs-category-card .icon')).toHaveCount(0);
  for (const [id, filename] of [['presentation', 'Chai_girll_tea_presentation_1'], ['preparation', 'making_video_2_1'], ['story-skits', 'disabled_1'], ['fast-cuts', 'onam_out']]) {
    const cover = page.locator(`.cs-category-card--${id} .cs-category-cover img`);
    await expect(cover).toHaveAttribute('src', new RegExp(`${filename}\\.jpg$`));
    await expect(cover).toHaveCSS('filter', 'blur(6px)');
  }
  await page.getByRole('button', { name: 'Previous category', exact: true }).click();
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Category 4 of 4');
  await page.getByRole('button', { name: 'Next category', exact: true }).click();
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Category 1 of 4');
  await page.locator('.cs-card.is-active').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Category 2 of 4');
  await page.keyboard.press('Enter');
  const dialog = page.locator('.category-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName('Preparation');
  await expect(dialog.locator('.cs-card')).toHaveCount(1);
  await expect(dialog.locator('.cs-card.is-active')).toHaveAccessibleName('Making Video — Behind the Scenes');
  await expect(page.getByRole('button', { name: 'Close category' })).toBeFocused();
  await dialog.locator('.cs-card.is-active').click();
  const player = page.locator('.cs-fullscreen');
  await expect(player).toBeVisible();
  await expect(player).toHaveAccessibleName('Making Video — Behind the Scenes');
  await expect(player.locator('video')).toHaveAttribute('src', /making_video_2_1\.mp4$/);
  await page.keyboard.press('Escape');
  await expect(player).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.cs-card.is-active')).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.cs-card.is-active')).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  for (const [label, titles] of [
    ['Story Skits', ['Disabled — Social Awareness', 'Boy and Friend — Social Content', 'Troll Video — Comedy Edit']],
    ['Fast Cuts', ['Onam — Festival Content']],
    ['Presentation', ['Chai Girl — Brand Presentation', 'Aabis Chai — Brand Content']],
  ]) {
    await page.getByRole('button', { name: 'Next category', exact: true }).click();
    await page.getByRole('button', { name: `Explore ${label}`, exact: true }).click();
    await expect(dialog).toHaveAccessibleName(label);
    await expect(dialog.locator('.cs-card')).toHaveCount(titles.length);
    expect(await dialog.locator('.cs-card').evaluateAll(cards => cards.map(card => card.getAttribute('aria-label')))).toEqual(titles);
    await dialog.locator('.cs-card.is-active').click();
    await expect(player).toHaveAccessibleName(titles[0]);
    if (titles.length > 1) {
      await player.getByRole('button', { name: 'Next video' }).click();
      await expect(player).toHaveAccessibleName(titles[1]);
    }
    await page.getByRole('button', { name: 'Close project' }).click();
    await expect(player).toHaveCount(0);
    await page.getByRole('button', { name: 'Close category' }).click();
    await expect(dialog).toHaveCount(0);
  }
});

test('form validates and prepares a WhatsApp draft without sending a message', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.open = (...args) => { window.__opened = args; return null; };
  });
  await page.goto('/#contact', { waitUntil: 'domcontentloaded' });
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

test('dragging the carousel advances without accidentally opening a category', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#featured-work', { waitUntil: 'domcontentloaded' });
  const card = page.locator('.cs-card.is-active');
  await card.scrollIntoViewIfNeeded();
  const bounds = await card.boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('#csProgress')).toHaveAttribute('aria-label', 'Category 2 of 4');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('reduced motion stops marquees and automatic carousel movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#featured-work', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.video-bg[src]')).toHaveCount(0);
  await expect(page.locator('.cs-vid')).toHaveCount(0);
  await expect(page.locator('.cs-category-cover video')).toHaveCount(0);
  await expect(page.locator('.cs-category-cover img')).toHaveCount(4);
  expect(await page.locator('.component-marquee-track').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  const progress = page.locator('#csProgress');
  await expect(progress).toHaveAttribute('aria-label', 'Category 1 of 4');
  await page.clock.install();
  await page.clock.fastForward(14000);
  await expect(progress).toHaveAttribute('aria-label', 'Category 1 of 4');
});

test('the video background fills the hero and keeps the foreground links usable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.hero-art, .art-wordmark, .art-orbit')).toHaveCount(0);
  const heroBackground = await page.locator('.hero').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const background = getComputedStyle(element);
    return { color: background.backgroundColor, width: bounds.width, height: bounds.height };
  });
  expect(heroBackground.color).toBe('rgb(246, 244, 238)');
  expect(heroBackground.width).toBeCloseTo(page.viewportSize().width, 0);
  expect(heroBackground.height).toBeGreaterThan(600);
  const artwork = await page.locator('.hero-background').boundingBox();
  expect(artwork.width).toBeCloseTo(heroBackground.width, 0);
  expect(artwork.height).toBeCloseTo(heroBackground.height, 0);
  await page.locator('.hero').getByRole('link', { name: 'Explore our work' }).click();
  await expect(page).toHaveURL(/#featured-work$/);
});

test('background videos follow the theme, defer offscreen loading and honor reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const heroVideo = page.locator('.hero-background video[data-video-theme="light"]');
  const darkVideo = page.locator('.hero-background video[data-video-theme="dark"]');
  await expect(heroVideo).toHaveAttribute('src', /background-light-v1-(960|1440)\.mp4$/);
  await expect(page.locator('.ambient-section video[src], .footer-background video[src]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect(darkVideo).toHaveAttribute('src', /background-dark-v1-(960|1440)\.mp4$/);
  await expect(page.locator('.hero-background .video-poster--dark')).toHaveCSS('opacity', '1');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(darkVideo).toHaveAttribute('src', /background-dark-v1-(960|1440)\.mp4$/);
  await page.locator('#services').scrollIntoViewIfNeeded();
  await expect(page.locator('#services .video-bg[data-video-theme="dark"]')).toHaveAttribute('src', /background-dark-v1-(960|1440)\.mp4$/);
  await expect.poll(() => heroVideo.evaluate(video => video.paused)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.background-media video[src]')).toHaveCount(0);
  await expect(page.locator('#services .video-poster--dark')).toBeVisible();
  await expect(page.locator('#featured-work .background-media, #process .background-media, #faq .background-media')).toHaveCount(0);
  for (const id of ['services', 'contact']) {
    const poster = page.locator(`#${id} .video-poster--dark`);
    expect(await poster.evaluate(element => getComputedStyle(element).filter)).toMatch(/blur\((20|28)px\)/);
    await expect(page.locator(`#${id}`)).toHaveCSS('filter', 'none');
  }
});

test('the hero stays readable when the background video cannot load', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-background .video-bg').first()).toHaveCSS('opacity', '0');
  await expect(page.locator('.hero-background .video-poster--light')).toBeVisible();
  expect(await page.locator('.hero-background').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('radial-gradient');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect(page.locator('.hero-copy')).toHaveCSS('color', 'rgb(244, 244, 244)');
  await page.locator('.hero').getByRole('link', { name: 'Let’s talk' }).click();
  await expect(page).toHaveURL(/#contact$/);
});

test('the poster marquee scrolls horizontally in opposite directions and keeps moving on hover', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const marquee = page.locator('.marquee-3d');
  await marquee.scrollIntoViewIfNeeded();
  const rows = marquee.locator('.marquee-3d-plane > .component-marquee');
  await expect(rows).toHaveCount(2);
  await expect(marquee.locator('.component-marquee-vertical')).toHaveCount(0);
  for (let index = 0; index < 2; index++) {
    const track = rows.nth(index).locator('.component-marquee-track').first();
    await rows.nth(index).hover();
    await expect(track).toHaveCSS('animation-play-state', 'running');
    const before = await track.boundingBox();
    await expect.poll(async () => {
      const after = await track.boundingBox();
      expect(Math.abs(after.y - before.y)).toBeLessThan(1);
      return index === 0 ? before.x - after.x : after.x - before.x;
    }).toBeGreaterThan(2);
    const sources = await track.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    expect(new Set(sources).size).toBe(8);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test('production HTML is readable with JavaScript disabled and keeps SEO files', async ({ browser, request }) => {
  test.skip(process.env.E2E_DEV === '1', 'Static HTML is emitted by the production build.');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
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
