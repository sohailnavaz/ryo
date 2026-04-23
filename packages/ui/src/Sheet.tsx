import { Modal, Pressable, View } from 'react-native';
import { cn } from '@bnb/utils';
import { Heading } from './Heading';
import { IconButton } from './IconButton';
import { X } from './icons';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className={cn(
            'bg-surface rounded-t-3xl md:rounded-3xl md:self-center md:w-[540px] md:max-h-[85vh] md:my-auto px-5 pt-3 pb-8 max-h-[88%]',
            className,
          )}
        >
          <View className="items-center mb-2 md:hidden">
            <View className="h-1 w-10 rounded-full bg-surface-border" />
          </View>
          <View className="flex-row items-center justify-between mb-2">
            {title ? <Heading level={3}>{title}</Heading> : <View />}
            <IconButton onPress={onClose} className="bg-surface-alt">
              <X size={18} color="#222" />
            </IconButton>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
