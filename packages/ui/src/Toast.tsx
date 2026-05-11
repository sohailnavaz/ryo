// Brand-voice toast: warm but precise, never "Oops!".
// Built on a tiny event-bus + useSyncExternalStore so any component can call
// `toast.error('...')` without prop-drilling. Render <ToastViewport/> once at
// the app shell and you're set.

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { cn } from '@bnb/utils';
import { Text } from './Text';
import { Pressable } from './Pressable';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type Toast = {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
};

type State = { toasts: Toast[] };

let state: State = { toasts: [] };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): State {
  return state;
}

function push(t: Omit<Toast, 'id'>): string {
  const id = Math.random().toString(36).slice(2);
  state = { toasts: [...state.toasts, { ...t, id }] };
  emit();
  return id;
}

function dismiss(id: string): void {
  state = { toasts: state.toasts.filter((t) => t.id !== id) };
  emit();
}

export const toast = {
  show(message: string, opts?: { description?: string; variant?: ToastVariant; durationMs?: number }): string {
    return push({
      message,
      description: opts?.description,
      variant: opts?.variant ?? 'info',
      durationMs: opts?.durationMs ?? 5000,
    });
  },
  info(message: string, opts?: { description?: string; durationMs?: number }): string {
    return push({ message, description: opts?.description, variant: 'info', durationMs: opts?.durationMs ?? 5000 });
  },
  success(message: string, opts?: { description?: string; durationMs?: number }): string {
    return push({ message, description: opts?.description, variant: 'success', durationMs: opts?.durationMs ?? 4000 });
  },
  warning(message: string, opts?: { description?: string; durationMs?: number }): string {
    return push({ message, description: opts?.description, variant: 'warning', durationMs: opts?.durationMs ?? 6000 });
  },
  error(message: string, opts?: { description?: string; durationMs?: number }): string {
    return push({ message, description: opts?.description, variant: 'error', durationMs: opts?.durationMs ?? 7000 });
  },
  dismiss,
};

function useToasts(): Toast[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot().toasts,
    () => [] as Toast[],
  );
}

const VARIANT_CLASS: Record<ToastVariant, string> = {
  info: 'bg-ink border-ink',
  success: 'bg-[#0F3D2A] border-[#0F3D2A]',
  warning: 'bg-[#5A3A06] border-[#5A3A06]',
  error: 'bg-[#5A1A10] border-[#5A1A10]',
};

export function ToastViewport() {
  const toasts = useToasts();
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0 items-center justify-end pb-6 md:items-end md:pr-6"
    >
      <View className="gap-2 w-full max-w-[420px] px-4 md:px-0">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </View>
    </View>
  );
}

function ToastCard({ toast: t }: { toast: Toast }) {
  const dismissedRef = useRef(false);
  useEffect(() => {
    if (t.durationMs <= 0) return;
    const id = setTimeout(() => {
      if (!dismissedRef.current) dismiss(t.id);
    }, t.durationMs);
    return () => clearTimeout(id);
  }, [t.id, t.durationMs]);

  return (
    <Pressable
      onPress={() => {
        dismissedRef.current = true;
        dismiss(t.id);
      }}
      className={cn(
        'rounded-2xl border px-4 py-3 shadow-pop pointer-events-auto',
        VARIANT_CLASS[t.variant],
      )}
    >
      <Text className="text-white font-semibold">{t.message}</Text>
      {t.description ? (
        <Text variant="small" className="text-white opacity-80 mt-0.5">
          {t.description}
        </Text>
      ) : null}
    </Pressable>
  );
}
