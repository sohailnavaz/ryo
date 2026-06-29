import { expect, test } from '@playwright/test';

// Happy-path smoke suite. Runs against the production build in preview mode, so
// the deterministic dummy catalogue (16 listings) is served — no live backend.
//
// Note: @bnb/ui primitives are react-native-web, so headings render as <div>s
// (no semantic <h1>); assertions use text/role accordingly. We also pre-seed
// localStorage so the first-run onboarding modal + cookie banner don't overlay
// the UI and intercept clicks.

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem('ryo.onboarded', '1');
    window.localStorage.setItem(
      'ryo.cookie-consent',
      JSON.stringify({ necessary: true, functional: true, analytics: false, decided: true }),
    );
  });
});

test('home renders the hero, sort bar and listings', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Ryo/);
  // Hero copy also appears in the footer tagline → scope to the first match.
  await expect(page.getByText('Stay anywhere', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Recommended', { exact: false })).toBeVisible();
  // At least one listing card rendered (cards carry photos).
  await expect(page.locator('img').first()).toBeVisible();
  // Resource hints warm up the image/tile CDNs.
  expect(await page.locator('link[rel="preconnect"]').count()).toBeGreaterThan(0);
});

test('a listing detail page renders with SEO metadata', async ({ page }) => {
  await page.goto('/listing/l-positano-cliffside');
  // generateMetadata humanizes the slug → "Positano Cliffside · Ryo".
  await expect(page).toHaveTitle(/Positano Cliffside/);
  // The route emits LodgingBusiness + BreadcrumbList JSON-LD server-side
  // (deterministic; the gallery itself is client-rendered and covered elsewhere).
  const html = await page.content();
  expect(html).toContain('LodgingBusiness');
  expect(html).toContain('BreadcrumbList');
});

test('legal pages are server-rendered and indexable', async ({ page }) => {
  await page.goto('/legal/privacy');
  await expect(page).toHaveTitle(/Privacy/i);
  await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
});

test('FAQ help center loads, emits FAQPage schema, and search filters', async ({ page }) => {
  await page.goto('/faq');
  expect(await page.content()).toContain('FAQPage');
  await expect(page.getByText('How can we help?', { exact: false })).toBeVisible();
  await page.getByPlaceholder(/Search help articles/i).fill('refund');
  await expect(page.getByText(/results? for/i)).toBeVisible();
});

test('sitemap and robots expose the right routes', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain('/legal/privacy');

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  const robotsBody = await robots.text();
  expect(robotsBody).toMatch(/Disallow/i);
  expect(robotsBody).toContain('/admin');
});

test('switching language translates the UI (i18n e2e)', async ({ page }) => {
  await page.goto('/');
  const english = 'Stay anywhere — and feel hosted.';
  await expect(page.getByText(english).first()).toBeVisible();

  // Open the footer language switcher and pick Español.
  await page.getByRole('button', { name: /English/ }).first().click();
  await page.getByRole('option', { name: /Español/ }).click();

  // The exact English hero/footer copy must be gone once Spanish is applied.
  await expect(page.getByText(english)).toHaveCount(0);
});
