import { Modal, Pressable, View } from 'react-native';
import { cn } from '@bnb/utils';
import { Button } from './Button';
import { Heading } from './Heading';
import { Text } from './Text';

export type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive (danger) variant. */
  destructive?: boolean;
  loading?: boolean;
  className?: string;
};

/**
 * Brand-styled confirmation dialog. Used to gate any privileged / irreversible
 * action behind an explicit second tap. For actions that also need a reason
 * code, use {@link ReasonCodeModal} instead.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
  className,
}: ConfirmModalProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <Pressable className="absolute inset-0" onPress={loading ? undefined : onClose} />
        <View
          className={cn(
            'w-full max-w-[440px] rounded-3xl bg-surface px-6 pt-6 pb-5',
            className,
          )}
        >
          <Heading level={3}>{title}</Heading>
          {message ? (
            <Text className="mt-2 text-ink-soft">{message}</Text>
          ) : null}
          <View className="mt-6 flex-row justify-end gap-3">
            <Button variant="ghost" onPress={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
