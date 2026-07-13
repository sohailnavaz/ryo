import { useEffect, useRef, useState } from 'react';
import { cn } from '@bnb/utils';

// ⌘K. (docs/15-admin-console.md §3)
//
// THE primary navigation of the console. An operator with a support email in front of
// them pastes the address and expects to land on the record — they do not open a list
// and scroll. Getting this right is most of what separates a console that feels
// professional from one that feels generated.
//
// Deliberately plain DOM rather than react-native `Modal` + `Pressable`, which is what
// the rest of `@bnb/ui` uses. The RN-Web modal swallows both clicks and key events on
// nested pressables — verified in a browser: neither Enter nor a click on a result
// fired. This is a `.web.tsx` platform split (same pattern as `nav.web.tsx` and
// `Map.web.tsx`), so using real DOM here is the intended escape hatch, not a violation.
// Tailwind still applies — `packages/ui/src` is in the web content globs.

export type CommandItem = {
  id: string;
  label: string;
  sublabel?: string;
  group?: string;
  /** Where selecting this goes. Carried on the item so the caller never re-derives it. */
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

export function CommandPalette({
  query,
  onQueryChange,
  items,
  onSelect,
  loading,
  placeholder = 'Search anything — email, name, booking id, city…',
  emptyText = 'Nothing matched.',
  hint = 'Paste an email, a name, a booking id, or a city.',
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl-K from anywhere, including while another input has focus.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    onQueryChange('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(0), [items.length]);

  if (!open) return null;

  const choose = (item: CommandItem) => {
    setOpen(false);
    onSelect(item);
  };

  // Navigation lives on the input, where focus actually is — no document-level
  // key routing, no stale-closure games.
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (items.length === 0 ? 0 : (a + 1) % items.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (items.length === 0 ? 0 : (a - 1 + items.length) % items.length));
    } else if (e.key === 'Enter') {
      const hit = items[active];
      if (hit) {
        e.preventDefault();
        choose(hit);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[12vh] px-5"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-[640px] bg-surface rounded-2xl border border-surface-border shadow-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Search"
            className="flex-1 bg-transparent text-[15px] text-ink py-1 outline-none placeholder:text-ink-soft"
          />
          <kbd className="text-[11px] text-ink-soft border border-surface-border rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-[13px] text-ink-soft">Searching…</div>
          ) : query.trim().length < 2 ? (
            <div className="px-4 py-6 text-[13px] text-ink-soft">{hint}</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-ink-soft">{emptyText}</div>
          ) : (
            items.map((item, i) => (
              <button
                key={`${item.group ?? ''}-${item.id}`}
                type="button"
                onClick={() => choose(item)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'w-full text-left flex items-center gap-3 px-4 py-3',
                  i === active && 'bg-surface-alt',
                )}
              >
                {item.group ? (
                  <span className="text-[11px] uppercase tracking-wide text-ink-soft border border-surface-border rounded px-1.5 py-0.5">
                    {item.group}
                  </span>
                ) : null}
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-medium text-ink truncate">
                    {item.label}
                  </span>
                  {item.sublabel ? (
                    <span className="block text-[12px] text-ink-soft truncate">{item.sublabel}</span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
