import * as ImagePicker from 'expo-image-picker';

/** A picked image, normalized to raw bytes so the API layer can upload it
 *  the same way on every platform. `uri` is a local preview URI. */
export type PickedImage = { uri: string; name: string; mimeType: string; bytes: Uint8Array };

/** atob is available in Hermes (RN 0.74+) and on web — no extra dependency. */
function base64ToBytes(b64: string): Uint8Array {
  const bin = globalThis.atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Open the OS photo library and return the chosen image(s) as bytes.
 *  Returns `[]` if the user cancels or denies permission. */
export async function pickImages(opts?: { multiple?: boolean }): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: opts?.multiple ?? false,
    quality: 0.8,
    base64: true,
  });
  if (res.canceled) return [];
  return res.assets
    .filter((a) => !!a.base64)
    .map((a, i) => ({
      uri: a.uri,
      name: a.fileName ?? `photo-${i}.jpg`,
      mimeType: a.mimeType ?? 'image/jpeg',
      bytes: base64ToBytes(a.base64 as string),
    }));
}

export function isImagePickerAvailable(): boolean {
  return true;
}
