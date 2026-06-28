import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Automated accessibility scan (axe-core, WCAG 2 A/AA). Gates on the most severe
// outcomes — any 'critical' or 'serious' violation fails the build. Pre-seeds
// localStorage so the onboarding/cookie overlays don't skew the scan.

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem('ryo.onboarded', '1');
    window.localStorage.setItem(
      'ryo.cookie-consent',
      JSON.stringify({ necessary: true, functional: true, analytics: false, decided: true }),
    );
  });
});

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'listing detail', path: '/listing/l-positano-cliffside' },
  { name: 'FAQ', path: '/faq' },
  { name: 'privacy policy', path: '/legal/privacy' },
];

for (const p of PAGES) {
  test(`no critical/serious a11y violations: ${p.name}`, async ({ page }) => {
    await page.goto(p.path);
    // Let client-rendered content settle.
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // color-contrast is a brand-palette / design concern (docs/branding.md is
      // the source of truth for tokens) — tracked separately, not gated here so
      // this suite stays a guard on *structural* a11y (labels, alt, roles, ARIA).
      .disableRules(['color-contrast'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    // Surface a readable summary when something fails.
    if (blocking.length > 0) {
      console.log(
        `\n[a11y] ${p.name} blocking violations:\n` +
          blocking
            .map((v) => `  • ${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`)
            .join('\n'),
      );
    }

    expect(blocking).toEqual([]);
  });
}
