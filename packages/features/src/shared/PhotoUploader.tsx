import { useState } from 'react';
import { Image, View } from 'react-native';
import { uploadListingPhoto } from '@bnb/api';
import { Button, Pressable, Text, VStack, X, toast } from '@bnb/ui';
import { pickImages } from '@bnb/ui/image-picker';

export type PhotoUploaderProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

/** Multi-photo uploader: pick from the OS library / file dialog, upload each to
 *  the `listing_photos` bucket, and hand back the resulting public URLs. Shows a
 *  thumbnail grid with per-photo remove. Order in the array = display order. */
export function PhotoUploader({ urls, onChange, disabled }: PhotoUploaderProps) {
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      const picked = await pickImages({ multiple: true });
      if (picked.length === 0) return;
      const uploaded: string[] = [];
      for (const img of picked) {
        try {
          uploaded.push(await uploadListingPhoto(img));
        } catch (e) {
          toast.error("Couldn't upload a photo.", {
            description: e instanceof Error ? e.message : undefined,
          });
        }
      }
      if (uploaded.length > 0) {
        onChange([...urls, ...uploaded]);
        toast.success(uploaded.length === 1 ? 'Photo added.' : `${uploaded.length} photos added.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = (url: string) => onChange(urls.filter((u) => u !== url));

  return (
    <VStack className="gap-3">
      {urls.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {urls.map((url) => (
            <View key={url} className="relative">
              <Image
                source={{ uri: url }}
                style={{ width: 96, height: 96, borderRadius: 12 }}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => remove(url)}
                accessibilityLabel="Remove photo"
                className="absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full bg-ink"
              >
                <X size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <Button
        title={busy ? 'Uploading…' : urls.length > 0 ? 'Add more photos' : 'Upload photos'}
        variant="outline"
        onPress={add}
        loading={busy}
        disabled={disabled || busy}
      />
      <Text variant="caption" className="text-ink-soft">
        Upload from your device — the first photo is the cover.
      </Text>
    </VStack>
  );
}
