import { useMemo, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import {
  createCollection,
  deleteCollection,
  renameCollection,
  useFavoriteIds,
  useFavorites,
  useToggleFavorite,
  useWishlistCollections,
} from '@bnb/api';
import type { Listing } from '@bnb/db';
import {
  Button,
  Card,
  ConfirmModal,
  Heading,
  HStack,
  Input,
  ListingCard,
  Plus,
  Pressable,
  Sheet,
  Skeleton,
  Text,
  toast,
  VStack,
} from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';
import { SaveToCollectionSheet } from './SaveToCollectionSheet';

// `all` = the existing flat favourites set; any other id = a named list.
type Selected = 'all' | string;

export function FavoritesScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { data = [], isLoading } = useFavorites();
  const { data: favIds = [] } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const collections = useWishlistCollections();

  const [selected, setSelected] = useState<Selected>('all');
  const [saveTarget, setSaveTarget] = useState<Listing | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = width >= 1280 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  // The active list resolves to the favourites filtered by membership (or the
  // full set when "All saved" is active). Listings only ever come from the real
  // favourites query, so removing a save anywhere stays consistent.
  const activeCollection =
    selected === 'all' ? null : collections.find((c) => c.id === selected) ?? null;

  const visible = useMemo(() => {
    if (!activeCollection) return data;
    const ids = new Set(activeCollection.listing_ids);
    return data.filter((l) => ids.has(l.id));
  }, [data, activeCollection]);

  const create = () => {
    const trimmed = createName.trim();
    if (!trimmed) {
      toast.error('Give your list a name.');
      return;
    }
    const id = createCollection(trimmed);
    toast.success(`Created “${trimmed}”.`);
    setCreateName('');
    setCreateOpen(false);
    setSelected(id);
  };

  const doRename = () => {
    if (!renameId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast.error('Name can’t be empty.');
      return;
    }
    renameCollection(renameId, trimmed);
    setRenameId(null);
    setRenameValue('');
    toast.success('List renamed.');
  };

  const doDelete = () => {
    if (!deleteId) return;
    deleteCollection(deleteId);
    if (selected === deleteId) setSelected('all');
    setDeleteId(null);
    toast.success('List deleted. Your saved stays are untouched.');
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-6 md:px-10 md:mx-auto md:w-full md:max-w-[1200px]">
        <HStack className="justify-between items-center">
          <Heading level={1}>Wishlists</Heading>
          <Button
            title="New list"
            variant="outline"
            size="sm"
            leftIcon={<Plus size={16} color="#0E1A2B" />}
            onPress={() => setCreateOpen(true)}
          />
        </HStack>

        {/* List chips */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Chip
            label="All saved"
            count={data.length}
            active={selected === 'all'}
            onPress={() => setSelected('all')}
          />
          {collections.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              count={c.listing_ids.length}
              active={selected === c.id}
              onPress={() => setSelected(c.id)}
            />
          ))}
        </View>

        {/* Active named-list controls */}
        {activeCollection ? (
          <HStack className="mt-3 gap-2">
            <Button
              title="Rename"
              variant="ghost"
              size="sm"
              onPress={() => {
                setRenameId(activeCollection.id);
                setRenameValue(activeCollection.name);
              }}
            />
            <Button
              title="Delete list"
              variant="ghost"
              size="sm"
              onPress={() => setDeleteId(activeCollection.id)}
            />
          </HStack>
        ) : null}
      </View>

      {isLoading ? (
        <View className="p-4 flex-row flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-60 flex-1 min-w-[40%]" />
          ))}
        </View>
      ) : visible.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Heading level={3}>
            {activeCollection ? `“${activeCollection.name}” is empty` : 'No saved stays yet'}
          </Heading>
          <Text className="text-ink-soft mt-2 text-center max-w-[420px]">
            {activeCollection
              ? 'Tap “Save to list” on any saved stay to add it here.'
              : 'Tap the heart on any listing to save it.'}
          </Text>
        </View>
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={visible}
          keyExtractor={(l) => l.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap: 24 } : undefined}
          contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 80 }}
          style={{ alignSelf: 'center', width: '100%', maxWidth: 1200 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ListingCard
                listing={item}
                isFavorite={favIds.includes(item.id)}
                onPress={() => router.push(`/listing/${item.id}`)}
                onToggleFavorite={() =>
                  toggleFav.mutate({ listingId: item.id, on: !favIds.includes(item.id) })
                }
              />
              <Button
                title="Save to list"
                variant="ghost"
                size="sm"
                className="mt-1 self-start"
                onPress={() => setSaveTarget(item)}
              />
            </View>
          )}
        />
      )}

      {/* Per-listing "save to list" sheet */}
      <SaveToCollectionSheet
        open={!!saveTarget}
        onClose={() => setSaveTarget(null)}
        listingId={saveTarget?.id ?? null}
        listingTitle={saveTarget?.title}
      />

      {/* Create list sheet */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New wishlist">
        <VStack className="gap-3">
          <Input
            label="List name"
            placeholder="e.g. Summer in Italy"
            value={createName}
            onChangeText={setCreateName}
            autoFocus
          />
          <Button title="Create list" onPress={create} />
        </VStack>
      </Sheet>

      {/* Rename sheet */}
      <Sheet open={!!renameId} onClose={() => setRenameId(null)} title="Rename list">
        <VStack className="gap-3">
          <Input
            label="List name"
            value={renameValue}
            onChangeText={setRenameValue}
            autoFocus
          />
          <Button title="Save" onPress={doRename} />
        </VStack>
      </Sheet>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={doDelete}
        destructive
        title="Delete this list?"
        message="The list is removed, but the stays inside stay in your saved favourites."
        confirmLabel="Delete list"
      />
    </View>
  );
}

function Chip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        active ? 'border-ink bg-surface-alt' : 'border-surface-border'
      }`}
    >
      <Text className="font-semibold" numberOfLines={1}>
        {label}
        {count > 0 ? ` · ${count}` : ''}
      </Text>
    </Pressable>
  );
}
