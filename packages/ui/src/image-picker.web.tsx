/** A picked image, normalized to raw bytes so the API layer can upload it
 *  the same way on every platform. `uri` is an object-URL preview. */
export type PickedImage = { uri: string; name: string; mimeType: string; bytes: Uint8Array };

/** Open the browser file picker and return the chosen image(s) as bytes.
 *  Resolves `[]` if the user cancels (detected via the window regaining focus
 *  with no file selected). */
export async function pickImages(opts?: { multiple?: boolean }): Promise<PickedImage[]> {
  if (typeof document === 'undefined') return [];
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = opts?.multiple ?? false;
    input.style.display = 'none';

    let settled = false;
    const finish = (imgs: PickedImage[]) => {
      if (settled) return;
      settled = true;
      input.removeEventListener('change', onChange);
      window.removeEventListener('focus', onFocus);
      input.remove();
      resolve(imgs);
    };

    const onChange = async () => {
      const files = Array.from(input.files ?? []);
      const imgs = await Promise.all(
        files.map(async (f) => ({
          uri: URL.createObjectURL(f),
          name: f.name,
          mimeType: f.type || 'image/jpeg',
          bytes: new Uint8Array(await f.arrayBuffer()),
        })),
      );
      finish(imgs);
    };

    // Cancel detection: closing the dialog returns focus to the window. Give the
    // change event a beat to land first; if no file was chosen, resolve empty.
    const onFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) finish([]);
      }, 400);
    };

    input.addEventListener('change', onChange);
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}

export function isImagePickerAvailable(): boolean {
  return typeof document !== 'undefined';
}
