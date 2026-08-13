// Provider-agnostic transactional send. Defaults to Resend (simple, India-friendly,
// generous free tier); swap the one fetch call for SES/Postmark without touching any
// template. Fails SOFT + LOUD when unconfigured: it logs and no-ops rather than
// throwing, so a missing key never breaks a booking — but it's obvious in logs.
//
// Set RESEND_API_KEY (+ optional EMAIL_FROM) to go live. Until then, sends are logged.

import type { EmailDoc } from './layout';

export type SendResult = { ok: boolean; id?: string; skipped?: boolean; error?: string };

const FROM = () => process.env.EMAIL_FROM ?? 'Ryo <hello@ryo.app>';

export async function sendEmail(to: string, doc: EmailDoc): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // eslint-disable-next-line no-console
    console.warn(`[emails] RESEND_API_KEY not set — would send "${doc.subject}" to ${to} (skipped).`);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: FROM(), to, subject: doc.subject, html: doc.html, text: doc.text }),
    });
    if (!res.ok) return { ok: false, error: `resend ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
