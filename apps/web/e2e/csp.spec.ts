import { expect, test } from '@playwright/test';

// Verifies the Content-Security-Policy is (a) actually sent and (b) doesn't
// break the app — no CSP-violation errors on the pages that load external
// origins (Supabase, map tiles, remote images).

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem('ryo.onboarded', '1');
    window.localStorage.setItem(
      'ryo.cookie-consent',
      JSON.stringify({ necessary: true, functional: true, analytics: false, decided: true }),
    );
  });
});

test('CSP header is sent and locks script-src to self', async ({ request }) => {
  const res = await request.get('/');
  const csp = res.headers()['content-security-policy'];
  expect(csp, 'CSP header present').toBeTruthy();
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'self'");
});

for (const path of ['/', '/listing/l-positano-cliffside', '/faq', '/discover']) {
  test(`no CSP violations on ${path}`, async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (msg) => {
      const t = msg.text();
      if (/content security policy/i.test(t)) violations.push(t);
    });
    page.on('pageerror', (err) => {
      if (/content security policy/i.test(err.message)) violations.push(err.message);
    });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(violations, violations.join('\n')).toEqual([]);
  });
}
