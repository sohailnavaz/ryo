/** Right-size a remote image URL to roughly the width it renders at, to save
 *  bandwidth on slow connections. Only rewrites Unsplash URLs (sets the `w` +
 *  quality params); any other URL is returned unchanged. Pass the displayed
 *  width (it doubles internally for crisp retina without over-fetching). */
export function sizeImage(url: string | undefined | null, displayWidth: number, quality = 70): string {
  if (!url) return '';
  if (!url.includes('images.unsplash.com')) return url;
  const w = Math.round(displayWidth * 2); // 2x for retina
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(w));
    u.searchParams.set('q', String(quality));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}
