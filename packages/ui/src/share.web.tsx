export type ShareContent = { title?: string; message: string; url?: string };

/**
 * Cross-platform share. Web uses the Web Share API where available (mobile browsers,
 * Safari), else copies the link to the clipboard. Returns what happened so the caller
 * can toast the right thing.
 */
export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed';

export async function shareContent(c: ShareContent): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && (navigator as Navigator).share) {
    try {
      await (navigator as Navigator).share({ title: c.title, text: c.message, url: c.url });
      return 'shared';
    } catch {
      /* user dismissed → fall through to copy */
    }
  }
  const link = c.url ?? c.message;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      return 'copied';
    }
  } catch {
    /* ignore */
  }
  return 'failed';
}

export const canShare = true;
