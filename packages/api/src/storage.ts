// Storage uploads — real file upload to Supabase Storage.
//
// Two public-read buckets (see supabase/migrations/0013_storage.sql):
//   * listing_photos — host listing imagery
//   * avatars        — profile photos
// Both are owner-write: the object path must start with the caller's uid, which
// RLS enforces. We write to `<uid>/<random>.<ext>` and hand back the public URL.
//
// The image bytes arrive from `@bnb/ui/image-picker` (`pickImages`), which
// normalizes web File objects and native photo-library assets to the same
// `{ name, mimeType, bytes }` shape — so this layer is platform-agnostic.

import { getSupabase } from './client';

/** Structural type — matches `PickedImage` from `@bnb/ui/image-picker` without
 *  creating a package dependency from api → ui. */
export type UploadableImage = { name: string; mimeType: string; bytes: Uint8Array };

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function extFor(mime: string): string {
  return EXT_BY_MIME[mime.toLowerCase()] ?? 'jpg';
}

/** Short random id for the object name — collision-safe enough within a uid folder. */
function randomKey(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8)
  );
}

async function uploadTo(
  bucket: 'listing_photos' | 'avatars',
  image: UploadableImage,
): Promise<string> {
  const supabase = getSupabase(); // throws if unconfigured → surfaced by the UI
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to upload images.');

  const path = `${user.id}/${randomKey()}.${extFor(image.mimeType)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, image.bytes, {
    contentType: image.mimeType || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload one listing photo; returns its public URL (store in `listing_photos.url`). */
export function uploadListingPhoto(image: UploadableImage): Promise<string> {
  return uploadTo('listing_photos', image);
}

/** Upload a profile avatar; returns its public URL (store in `profiles.avatar_url`). */
export function uploadAvatar(image: UploadableImage): Promise<string> {
  return uploadTo('avatars', image);
}
