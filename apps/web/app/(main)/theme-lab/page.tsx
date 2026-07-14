'use client';

import { useState } from 'react';
import { DUMMY_LISTINGS } from '@bnb/api';
import { Badge, Button, Card, Divider, Heading, Input, ListingCard, Text } from '@bnb/ui';

// THEME LAB — a decision surface, not a feature. (docs/branding.md)
//
// The point: these are the REAL @bnb/ui components — the same ListingCard, Button,
// Badge, Card and Input that ship — re-tinted live by a scoped CSS override layer.
// A mockup would let me draw something prettier than the app can actually render;
// this cannot lie to you, because it IS the app.
//
// The override layer below is throwaway. When a direction is picked, the palette moves
// into `packages/config/tailwind.preset.ts` + `docs/branding.md` (the brand is
// doc-driven — code follows the doc, never the reverse) and this page is deleted.

type ThemeKey = 'ryo' | 'neo' | 'noir';

const THEMES: Array<{
  key: ThemeKey;
  name: string;
  tagline: string;
  pitch: string;
  swatches: string[];
  risk: string;
}> = [
  {
    key: 'ryo',
    name: 'A · Ryo, sharpened',
    tagline: 'The locked brand, with the volume up',
    pitch:
      'Same terracotta/cream/ink and Fraunces+Inter. Bigger display type, more contrast, tighter grid, tactile press. Nothing in docs/branding.md, BUSINESS_MODEL or the partner PDF has to change.',
    swatches: ['#C87156', '#1F5A6B', '#FAF6F0', '#0E1A2B'],
    risk: 'Zero doc churn. Least "trendy".',
  },
  {
    key: 'neo',
    name: 'B · Gen-Z bold',
    tagline: 'Acid lime, violet, hot coral',
    pitch:
      'High-energy and unmissable. Chunky radii, thick borders, sticker badges, black display type on near-white. Reads young, social, screenshot-friendly.',
    swatches: ['#CCFF00', '#7C4DFF', '#FF5C5C', '#111111'],
    risk: 'Replaces the brand. Partner briefing + BUSINESS_MODEL + PDF all need rewriting.',
  },
  {
    key: 'noir',
    name: 'C · Neon noir',
    tagline: 'Dark-first, glass, glow',
    pitch:
      'Near-black canvas, electric cyan + magenta, glassy cards, glow on focus. Photos of places pop hard against it — the travel-reels aesthetic.',
    swatches: ['#00E5FF', '#FF2D95', '#0B0B12', '#EAEAF2'],
    risk: 'Replaces the brand. Also needs a dark-mode pass on every screen.',
  },
];

export default function ThemeLabPage() {
  const [theme, setTheme] = useState<ThemeKey>('ryo');
  const active = THEMES.find((t) => t.key === theme)!;
  const listings = DUMMY_LISTINGS.slice(0, 3);

  return (
    <div className={`theme-lab theme-${theme}`}>
      <style>{OVERRIDES}</style>

      <div className="lab-canvas min-h-screen px-5 py-8">
        <div className="mx-auto max-w-[1180px]">
          <Heading level={1}>Theme lab</Heading>
          <Text className="text-ink-soft mt-2 max-w-[620px]">
            The real components, re-tinted live. Pick a direction — then I rewrite
            docs/branding.md to match and roll it across guest, host and admin.
          </Text>

          {/* Switcher */}
          <div className="mt-6 flex flex-wrap gap-2 relative z-10">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`lab-chip px-4 py-2.5 rounded-full text-[13px] font-semibold border transition ${
                  theme === t.key ? 'lab-chip-on' : ''
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* What you're looking at */}
          <Card className="mt-5 p-5">
            <div className="flex flex-wrap justify-between items-start gap-5">
              <div className="flex flex-col flex-1 min-w-[280px] gap-1">
                <Text className="font-semibold">{active.tagline}</Text>
                <Text variant="small" className="text-ink-soft">
                  {active.pitch}
                </Text>
                <Text variant="small" className="text-ink-soft mt-1">
                  <strong>Cost of choosing this:</strong> {active.risk}
                </Text>
              </div>
              <div className="flex gap-2">
                {active.swatches.map((c) => (
                  <div
                    key={c}
                    title={c}
                    className="h-11 w-11 rounded-xl border border-surface-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* Guest surface — the one that decides the brand */}
          <SectionLabel>Guest · explore</SectionLabel>
          <div className="grid gap-5 md:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>

          {/* Controls */}
          <SectionLabel>Controls</SectionLabel>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3 [&>*]:!w-auto">
              <Button title="Reserve" />
              <Button title="Save" variant="secondary" />
              <Button title="Filters" variant="outline" />
              <Button title="Cancel" variant="ghost" />
              <Button title="Suspend" variant="danger" />
            </div>
            <Divider className="my-5" />
            <div className="flex flex-wrap items-center gap-2 [&>*]:!w-auto">
              <Badge>Guest favourite</Badge>
              <Badge variant="dark">admin</Badge>
              <Badge variant="brand">suspended</Badge>
              <Badge variant="neutral">tier 1</Badge>
            </div>
            <Divider className="my-5" />
            <div className="max-w-[380px]">
              <Input label="Where to?" placeholder="Goa, India" />
            </div>
          </Card>

          {/* Admin surface — you asked for the console to change too */}
          <SectionLabel>Admin · finance</SectionLabel>
          <Card className="p-5">
            <Text variant="label" className="mb-3">
              Profit &amp; loss
            </Text>
            <PLRow label="GMV — what guests paid" value="₹6,188" muted />
            <PLRow label="less: host payouts (never ours)" value="(₹1,707)" muted />
            <Divider className="my-2" />
            <PLRow label="NET REVENUE" value="₹884" bold />
            <PLRow label="less: variable costs" value="(₹415)" muted />
            <Divider className="my-2" />
            <PLRow label="CONTRIBUTION MARGIN" value="₹469" bold />
            <Text variant="small" className="text-ink-soft mt-1">
              53% of net revenue · this is the line that says whether the business works
            </Text>
          </Card>

          <Text variant="small" className="text-ink-soft mt-8 mb-4 block">
            Dense, low-drama layouts are deliberate in the console — an ops tool wants
            legibility, not energy. The palette still follows whichever direction you pick.
          </Text>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="label" className="mt-9 mb-3 block">
      {children}
    </Text>
  );
}

function PLRow({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1 gap-4">
      <Text variant={bold ? undefined : 'small'} className={bold ? 'font-semibold' : muted ? 'text-ink-soft' : ''}>
        {label}
      </Text>
      <Text variant={bold ? undefined : 'small'} className={bold ? 'font-semibold' : muted ? 'text-ink-soft' : ''}>
        {value}
      </Text>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The throwaway override layer.
//
// Tailwind compiles our tokens to fixed hex, so a theme cannot simply swap a CSS
// variable today. Rather than refactor the whole token system just to ASK a question,
// this scope re-paints the compiled utilities. It is preview-only and gets deleted the
// moment a direction is chosen — at which point the palette moves into the Tailwind
// preset and the branding doc properly (including the native `vars()` path).
// ---------------------------------------------------------------------------

const OVERRIDES = `
.theme-lab .lab-canvas { background: var(--lab-bg); transition: background .25s ease; }
.theme-lab .lab-chip { background: var(--lab-card); border-color: var(--lab-border); color: var(--lab-ink); }
.theme-lab .lab-chip-on { background: var(--lab-ink); color: var(--lab-bg); border-color: var(--lab-ink); }

/* A · Ryo, sharpened — the locked brand (baseline) */
.theme-ryo  { --lab-bg:#FAF6F0; --lab-card:#FFFFFF; --lab-alt:#EFE7DA; --lab-border:#CFC7BD;
              --lab-ink:#0E1A2B; --lab-soft:#5C5750; --lab-brand:#C87156; --lab-brand-soft:#FBF1ED;
              --lab-radius:1.25rem; --lab-bw:1px; }

/* B · Gen-Z bold */
.theme-neo  { --lab-bg:#F6F6F2; --lab-card:#FFFFFF; --lab-alt:#EFEFE7; --lab-border:#111111;
              --lab-ink:#111111; --lab-soft:#5A5A55; --lab-brand:#CCFF00; --lab-brand-soft:#F2FFC2;
              --lab-radius:1.75rem; --lab-bw:2px; }

/* C · Neon noir */
.theme-noir { --lab-bg:#0B0B12; --lab-card:#15151F; --lab-alt:#1D1D2A; --lab-border:#2E2E3F;
              --lab-ink:#EAEAF2; --lab-soft:#9A9AB0; --lab-brand:#00E5FF; --lab-brand-soft:#10303A;
              --lab-radius:1.25rem; --lab-bw:1px; }

/* Re-paint the compiled utilities inside the scope */
.theme-lab .bg-surface        { background-color: var(--lab-card) !important; }
.theme-lab .bg-surface-alt    { background-color: var(--lab-alt) !important; }
.theme-lab .bg-white          { background-color: var(--lab-card) !important; }
.theme-lab .bg-cream          { background-color: var(--lab-bg) !important; }
.theme-lab .bg-brand-50       { background-color: var(--lab-brand-soft) !important; }
.theme-lab .bg-brand-500,
.theme-lab .bg-brand-600      { background-color: var(--lab-brand) !important; }
.theme-lab .bg-ink            { background-color: var(--lab-ink) !important; }

.theme-lab .text-ink          { color: var(--lab-ink) !important; }
.theme-lab .text-ink-soft,
.theme-lab .text-ink-muted    { color: var(--lab-soft) !important; }
.theme-lab .text-surface      { color: var(--lab-bg) !important; }
.theme-lab .text-white        { color: var(--lab-bg) !important; }
.theme-lab .text-brand-500,
.theme-lab .text-brand-700    { color: var(--lab-brand) !important; }

.theme-lab .border-surface-border,
.theme-lab .border-brand-500  { border-color: var(--lab-border) !important; }

.theme-lab [class*="rounded-2xl"],
.theme-lab [class*="rounded-3xl"] { border-radius: var(--lab-radius) !important; }

/* Gen-Z: thick ink borders + hard shadow = sticker energy */
.theme-neo .shadow-card,
.theme-neo .shadow-soft { box-shadow: 4px 4px 0 #111111 !important; }
.theme-neo [class*="border"] { border-width: var(--lab-bw) !important; }
.theme-neo .bg-brand-500 { color: #111111 !important; }
.theme-neo .bg-brand-500 * { color: #111111 !important; }

/* Noir: glass + glow */
.theme-noir .shadow-card,
.theme-noir .shadow-soft { box-shadow: 0 8px 40px rgba(0,229,255,.10) !important; }
.theme-noir .bg-surface { backdrop-filter: blur(8px); }
.theme-noir .bg-brand-500 { color: #04141A !important; }
.theme-noir .bg-brand-500 * { color: #04141A !important; }
`;
