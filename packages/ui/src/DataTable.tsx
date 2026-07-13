import type { ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import { cn } from '@bnb/utils';
import { Check, ChevronDown } from './icons';
import { Card } from './Card';
import { Pressable } from './Pressable';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

// The ONE table in the console. (docs/15-admin-console.md §3)
//
// Built once so it is built correctly: virtualized body, sticky header, server-fed
// rows (it never filters or sorts — it renders what it is given), selection with a
// cap, and honest empty/loading states.
//
// It deliberately has no `filter` or `sort` implementation of its own. Sorting emits
// an event and the SERVER re-sorts. A table that sorts its own rows can only ever
// sort the page it happens to be holding, which is a lie the moment there are two
// pages — the classic bug where "sort by highest spend" shows the highest spender
// *on page one*.

export type Column<T> = {
  key: string;
  header: string;
  /** Flex weight relative to the other columns. */
  flex?: number;
  align?: 'left' | 'right';
  /** Hide on phones — the row still renders, just tighter. */
  desktopOnly?: boolean;
  sortable?: boolean;
  render: (row: T) => ReactNode;
};

export type SortState = { field: string; dir: 'asc' | 'desc' };

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowPress?: (row: T) => void;

  loading?: boolean;
  loadingMore?: boolean;
  /** Called when the operator scrolls near the end — fetch the next keyset page. */
  onEndReached?: () => void;

  sort?: SortState;
  onSort?: (field: string) => void;

  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectPage?: (ids: string[]) => void;

  emptyTitle?: string;
  emptyMessage?: string;

  /** Body height. A fixed body is what lets the header stay put while rows scroll. */
  height?: number;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowPress,
  loading,
  loadingMore,
  onEndReached,
  sort,
  onSort,
  selectable,
  selectedIds,
  onToggleSelect,
  onSelectPage,
  emptyTitle = 'Nothing here',
  emptyMessage,
  height = 620,
  className,
}: DataTableProps<T>) {
  const selected = new Set(selectedIds ?? []);
  const pageIds = rows.map(rowKey);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  if (loading) {
    return (
      <Card className={cn('p-0 overflow-hidden', className)}>
        <View className="px-5 py-3 border-b border-surface-border bg-surface-alt">
          <Skeleton className="h-4 w-40" />
        </View>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} className="px-5 py-4 border-b border-surface-border">
            <Skeleton className="h-5 w-full" />
          </View>
        ))}
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className={cn('p-10 items-center', className)}>
        <Text className="font-semibold">{emptyTitle}</Text>
        {emptyMessage ? (
          <Text variant="small" className="text-ink-soft mt-1 text-center">
            {emptyMessage}
          </Text>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      {/* Header — sticky by virtue of sitting outside the scrolling body */}
      <View className="hidden md:flex md:flex-row md:items-center md:bg-surface-alt md:px-5 md:py-3 md:border-b md:border-surface-border">
        {selectable ? (
          <View className="w-8">
            <Checkbox
              checked={allOnPageSelected}
              onPress={() => onSelectPage?.(pageIds)}
              label="Select all on this page"
            />
          </View>
        ) : null}

        {columns.map((c) => {
          const active = sort?.field === c.key;
          const header = (
            <View
              className={cn(
                'flex-row items-center gap-1',
                c.align === 'right' && 'justify-end',
              )}
            >
              <Text variant="label" className={cn(active && 'text-ink')}>
                {c.header}
              </Text>
              {c.sortable ? (
                <View
                  className={cn(
                    'opacity-40',
                    active && 'opacity-100',
                    active && sort?.dir === 'asc' && 'rotate-180',
                  )}
                >
                  <ChevronDown size={13} />
                </View>
              ) : null}
            </View>
          );

          return (
            <View
              key={c.key}
              style={{ flex: c.flex ?? 1 }}
              className={cn(c.desktopOnly && 'hidden md:flex')}
            >
              {c.sortable && onSort ? (
                <Pressable onPress={() => onSort(c.key)}>{header}</Pressable>
              ) : (
                header
              )}
            </View>
          );
        })}
      </View>

      {/* Body — virtualized. Only what's on screen is mounted. */}
      <FlatList
        data={rows}
        keyExtractor={rowKey}
        style={{ height }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        initialNumToRender={25}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item, index }) => {
          const id = rowKey(item);
          const isSelected = selected.has(id);
          const row = (
            <View
              className={cn(
                'flex-row items-center px-4 md:px-5 py-3',
                index !== rows.length - 1 && 'border-b border-surface-border',
                isSelected && 'bg-brand-50',
              )}
            >
              {selectable ? (
                <View className="w-8">
                  <Checkbox
                    checked={isSelected}
                    onPress={() => onToggleSelect?.(id)}
                    label="Select row"
                  />
                </View>
              ) : null}

              {columns.map((c) => (
                <View
                  key={c.key}
                  style={{ flex: c.flex ?? 1 }}
                  className={cn(
                    c.desktopOnly && 'hidden md:flex',
                    c.align === 'right' && 'items-end',
                  )}
                >
                  {c.render(item)}
                </View>
              ))}
            </View>
          );

          return onRowPress ? <Pressable onPress={() => onRowPress(item)}>{row}</Pressable> : row;
        }}
        ListFooterComponent={
          loadingMore ? (
            <View className="px-5 py-4">
              <Skeleton className="h-5 w-full" />
            </View>
          ) : null
        }
      />
    </Card>
  );
}

/**
 * A checkbox, which `@bnb/ui` didn't have — `Toggle` is a switch, and a switch means
 * "on/off setting", not "this row is selected".
 */
export function Checkbox({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} accessibilityRole="checkbox">
      <View
        className={cn(
          'w-[18px] h-[18px] rounded-[5px] border items-center justify-center',
          checked ? 'bg-brand-500 border-brand-500' : 'border-surface-border bg-surface',
        )}
      >
        {checked ? <Check size={12} color="#ffffff" /> : null}
      </View>
    </Pressable>
  );
}
