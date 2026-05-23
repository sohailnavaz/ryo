import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { cn } from '@bnb/utils';
import { Button } from './Button';
import { Heading } from './Heading';
import { Input } from './Input';
import { Text } from './Text';

export type ReasonCode = { code: string; label: string };

export type ReasonCodeResult = { reason_code: string; note: string };

export type ReasonCodeModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (result: ReasonCodeResult) => void;
  title: string;
  message?: string;
  reasonCodes: ReasonCode[];
  /** Require a free-text note in addition to the reason code. */
  requireNote?: boolean;
  notePlaceholder?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  className?: string;
};

/**
 * Reason-code + optional-note capture for privileged staff actions
 * (suspend, reject, refund, resolve, …). Every admin/concierge action that
 * writes to the audit log goes through this, per docs/14-admin-ops.md §4.
 */
export function ReasonCodeModal({
  open,
  onClose,
  onSubmit,
  title,
  message,
  reasonCodes,
  requireNote,
  notePlaceholder = 'Add context for the audit log…',
  confirmLabel = 'Apply',
  destructive,
  loading,
  className,
}: ReasonCodeModalProps) {
  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Reset the form whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setCode(null);
      setNote('');
    }
  }, [open]);

  const canSubmit = !!code && (!requireNote || note.trim().length > 0) && !loading;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <Pressable className="absolute inset-0" onPress={loading ? undefined : onClose} />
        <View
          className={cn(
            'w-full max-w-[460px] rounded-3xl bg-surface px-6 pt-6 pb-5',
            className,
          )}
        >
          <Heading level={3}>{title}</Heading>
          {message ? <Text className="mt-2 text-ink-soft">{message}</Text> : null}

          <Text variant="label" className="mt-5 mb-2">
            Reason code
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {reasonCodes.map((r) => {
              const active = r.code === code;
              return (
                <Pressable
                  key={r.code}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setCode(r.code)}
                  className={cn(
                    'rounded-full border px-4 py-2',
                    active ? 'bg-ink border-ink' : 'bg-surface border-surface-border',
                  )}
                >
                  <Text
                    variant="small"
                    className={active ? 'text-white font-semibold' : 'text-ink'}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4">
            <Input
              label={requireNote ? 'Note (required)' : 'Note (optional)'}
              value={note}
              onChangeText={setNote}
              placeholder={notePlaceholder}
              multiline
              numberOfLines={3}
              className="min-h-[64px]"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          <View className="mt-6 flex-row justify-end gap-3">
            <Button variant="ghost" onPress={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              disabled={!canSubmit}
              loading={loading}
              onPress={() => {
                if (canSubmit && code) onSubmit({ reason_code: code, note: note.trim() });
              }}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
