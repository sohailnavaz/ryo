// Email-safe brand layout for Ryo transactional mail.
//
// Email clients strip <style>, ignore custom fonts, and render inconsistently — so
// everything here is table-based with INLINE styles and web-safe fonts (Georgia for
// the editorial display voice, since Fraunces won't load in Gmail/Outlook). Palette
// follows docs/branding.md (warm: terracotta / cream / ink). Light-only on purpose —
// dark email templates render badly and hurt deliverability.

export const brand = {
  terracotta: '#C87156',
  terracottaDark: '#B15B41',
  ink: '#0E1A2B',
  inkSoft: '#5C5750',
  cream: '#FAF6F0',
  sand: '#EFE7DA',
  border: '#E2DACE',
  teal: '#1F5A6B',
  success: '#2E7D5B',
  white: '#FFFFFF',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DISPLAY = "Georgia, 'Times New Roman', serif";

export type EmailDoc = { subject: string; html: string; text: string };

/** A branded CTA button (bulletproof table button — works in Outlook). */
export function button(label: string, href: string, color = brand.terracotta): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr><td style="border-radius:999px;background:${color};">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:${brand.white};text-decoration:none;border-radius:999px;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

/** A key/value receipt-style row. */
export function row(label: string, value: string, opts: { strong?: boolean; big?: boolean } = {}): string {
  const w = opts.strong ? '700' : '400';
  const size = opts.big ? '18px' : '14px';
  const color = opts.strong ? brand.ink : brand.inkSoft;
  return `
  <tr>
    <td style="padding:7px 0;font-family:${FONT};font-size:14px;color:${brand.inkSoft};">${label}</td>
    <td align="right" style="padding:7px 0;font-family:${FONT};font-size:${size};font-weight:${w};color:${color};">${value}</td>
  </tr>`;
}

/**
 * Wrap body content in the Ryo shell: centered cream canvas, white card, wordmark
 * header, warm footer with the tagline. `preheader` is the inbox-preview snippet.
 */
export function wrapEmail(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:${brand.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.cream};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <!-- Wordmark -->
        <tr><td style="padding:4px 8px 20px;">
          <span style="font-family:${DISPLAY};font-size:26px;font-weight:600;letter-spacing:-0.5px;color:${brand.ink};">Ryo</span>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:${brand.white};border:1px solid ${brand.border};border-radius:18px;padding:36px 34px;">
          ${opts.bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:22px 8px 4px;font-family:${FONT};font-size:12px;line-height:18px;color:${brand.inkSoft};">
          <p style="margin:0 0 6px;font-family:${DISPLAY};font-style:italic;font-size:14px;color:${brand.ink};">Just Ryo it.</p>
          <p style="margin:0;">Vetted hosts · a 24/7 concierge · honest pricing.</p>
          <p style="margin:8px 0 0;">You’re receiving this because you have a Ryo account.
             <a href="{{unsubscribe}}" style="color:${brand.inkSoft};text-decoration:underline;">Notification settings</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Standard heading + lede + paragraph helpers for template bodies. */
export const h1 = (t: string) =>
  `<h1 style="margin:0 0 14px;font-family:${DISPLAY};font-size:26px;line-height:1.2;font-weight:600;color:${brand.ink};">${t}</h1>`;
export const p = (t: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${brand.inkSoft};">${t}</p>`;
export const strongInk = (t: string) => `<span style="color:${brand.ink};font-weight:600;">${t}</span>`;

/** A soft divider. */
export const divider = () =>
  `<div style="height:1px;background:${brand.border};margin:22px 0;"></div>`;
