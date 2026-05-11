// Brand-voice error boundary. Catches render-time exceptions in its subtree and
// shows a calm, honest fallback. Never "Oops!".

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { Heading } from './Heading';
import { Text } from './Text';
import { VStack } from './Stack';

type Props = {
  children: ReactNode;
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    // Surface for dev-tooling; production observability will route this to Sentry (M11).
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return <DefaultFallback error={error} reset={this.reset} />;
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-surface p-6">
      <VStack className="gap-3 max-w-[420px] w-full items-start">
        <Heading level={2}>Something just broke.</Heading>
        <Text className="text-ink-soft">
          We hit an unexpected error rendering this screen. We've logged it. You can try
          again, or go back to where you were.
        </Text>
        <Text variant="small" className="text-ink-soft mt-2" numberOfLines={3}>
          {error.message}
        </Text>
        <Button title="Try again" onPress={reset} fullWidth />
      </VStack>
    </View>
  );
}
