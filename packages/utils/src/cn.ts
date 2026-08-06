// Class-name joiner with last-wins resolution for COLOR conflicts.
//
// Why this exists: `Text`/`Button` variants bake in a colour (e.g. `text-ink`), and a
// caller often passes an override (`text-cream` for dark-on-accent text). A plain
// join leaves both classes, and NativeWind then resolves the tie by CSS source order
// (alphabetical), so `text-ink` silently beats `text-cream` no matter the intent —
// which is exactly how a dark theme goes invisible.
//
// This keeps behaviour identical for everything EXCEPT our own colour utilities, where
// the LAST one wins (what every caller means). It deliberately does NOT touch
// `text-[13px]`, `text-center`, spacing, etc. — only the scoped colour families below,
// so it can't misfire on a size or alignment class.

// Colour families we own (from the Tailwind preset). Anything matching
// `{prop}-{family}...` is treated as a colour for that property.
const COLOR_FAMILIES =
  'ink|ink-soft|ink-muted|cream|sand|white|black|transparent|brand|teal|warm|surface|danger|success|warning|info';

const COLOR_RE = new RegExp(`^(text|bg|border|fill|stroke)-(${COLOR_FAMILIES})(-[0-9]+)?(/[0-9]+)?$`);

export function cn(...classes: Array<string | false | null | undefined>): string {
  const tokens = classes.filter(Boolean).join(' ').split(/\s+/).filter(Boolean);

  // Track the last index a given colour PROPERTY was set, so earlier colour classes
  // for the same property are dropped. Non-colour classes pass through untouched.
  const lastColorProp = new Map<string, number>();
  tokens.forEach((tok, i) => {
    const m = tok.match(COLOR_RE);
    if (m) lastColorProp.set(m[1] as string, i); // m[1] = text|bg|border|fill|stroke
  });

  const out: string[] = [];
  tokens.forEach((tok, i) => {
    const m = tok.match(COLOR_RE);
    if (m && lastColorProp.get(m[1] as string) !== i) return; // a later colour for this prop wins
    out.push(tok);
  });
  return out.join(' ');
}
