// Native has no ⌘K, and the admin console is web-only (docs/15-admin-console.md §2).
//
// This split exists so `packages/features` can import CommandPalette unconditionally
// without breaking the Expo build. It renders nothing rather than shipping a
// half-working mobile palette — an honest no-op beats a fake surface.

export type CommandItem = {
  id: string;
  label: string;
  sublabel?: string;
  group?: string;
  href?: string;
};

export type CommandPaletteProps = {
  query: string;
  onQueryChange: (q: string) => void;
  items: CommandItem[];
  onSelect: (item: CommandItem) => void;
  loading?: boolean;
  placeholder?: string;
  emptyText?: string;
  hint?: string;
};

export function CommandPalette(_props: CommandPaletteProps): null {
  return null;
}
