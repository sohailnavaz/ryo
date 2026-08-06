import { Share } from 'react-native';

export type ShareContent = { title?: string; message: string; url?: string };

/**
 * Cross-platform share. Native uses the OS share sheet (react-native Share).
 * Returns 'shared' | 'dismissed' | 'failed'. iOS puts the url in `url`; Android
 * folds it into the message (it ignores a separate url), so we append it there.
 */
export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed';

export async function shareContent(c: ShareContent): Promise<ShareResult> {
  try {
    const message = c.url ? `${c.message} ${c.url}` : c.message;
    const res = await Share.share(
      { title: c.title, message, url: c.url },
      { subject: c.title },
    );
    return res.action === Share.sharedAction ? 'shared' : 'dismissed';
  } catch {
    return 'failed';
  }
}

export const canShare = true;
