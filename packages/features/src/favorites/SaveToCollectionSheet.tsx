import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useWishlistCollectionsApi } from '@bnb/api';
import {
  Button,
  Check,
  Divider,
  HStack,
  Input,
  Plus,
  Pressable,
  Sheet,
  Text,
  toast,
  VStack,
} from '@bnb/ui';

export type SaveToCollectionSheetProps = {
  open: boolean;
  onClose: () => void;
  listingId: string | null;
  listingTitle?: string;
};

/**
 * Bottom sheet for assigning one saved listing to named wishlist lists.
 * Toggle membership across existing lists, or create a new list inline.
 * Membership is additive on top of favourites — it never unfavourites.
 */
export function SaveToCollectionSheet({
  open,
  onClose,
  listingId,
  listingTitle,
}: SaveToCollectionSheetProps) {
  const { collections, addToCollection, removeFromCollection, createCollection } =
    useWishlistCollectionsApi();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const toggle = (collectionId: string, isIn: boolean) => {
    if (!listingId) return;
    const op = isIn
      ? removeFromCollection(collectionId, listingId)
      : addToCollection(collectionId, listingId);
    op.catch(() => toast.error('Couldn’t update your list. Please try again.'));
  };

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Give your list a name.');
      return;
    }
    createCollection(trimmed, listingId ?? undefined)
      .then(() => {
        toast.success(`Created “${trimmed}”.`);
        setName('');
        setCreating(false);
      })
      .catch(() => toast.error('Couldn’t create the list. Please try again.'));
  };

  return (
    <Sheet open={open} onClose={onClose} title="Save to a list">
      {listingTitle ? (
        <Text variant="small" className="text-ink-soft mb-2" numberOfLines={1}>
          {listingTitle}
        </Text>
      ) : null}

      <ScrollView style={{ maxHeight: 320 }} className="-mx-1">
        <VStack className="gap-1 px-1">
          {collections.length === 0 ? (
            <Text variant="small" className="text-ink-soft py-2">
              No lists yet. Create one below to start organising your saves.
            </Text>
          ) : (
            collections.map((c) => {
              const isIn = listingId ? c.listing_ids.includes(listingId) : false;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggle(c.id, isIn)}
                  className="flex-row items-center justify-between rounded-xl px-3 py-3 active:bg-surface-alt"
                >
                  <VStack>
                    <Text className="font-semibold">{c.name}</Text>
                    <Text variant="caption">
                      {c.listing_ids.length} {c.listing_ids.length === 1 ? 'stay' : 'stays'}
                    </Text>
                  </VStack>
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border ${
                      isIn ? 'bg-ink border-ink' : 'border-surface-border'
                    }`}
                  >
                    {isIn ? <Check size={14} color="#fff" /> : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </VStack>
      </ScrollView>

      <Divider className="my-3" />

      {creating ? (
        <VStack className="gap-2">
          <Input
            label="New list name"
            placeholder="e.g. Tokyo trip"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <HStack className="gap-2">
            <Button title="Create" onPress={create} />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setCreating(false);
                setName('');
              }}
            />
          </HStack>
        </VStack>
      ) : (
        <Button
          title="Create a new list"
          variant="outline"
          leftIcon={<Plus size={16} color="#0E1A2B" />}
          onPress={() => setCreating(true)}
        />
      )}
    </Sheet>
  );
}
