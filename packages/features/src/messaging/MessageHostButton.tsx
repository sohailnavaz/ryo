'use client';

import { useState } from 'react';
import { useSession, useStartThread } from '@bnb/api';
import { Button, Input, Sheet, Text, toast, VStack } from '@bnb/ui';
import { useRouter } from '@bnb/ui/nav';

// Drop-in "Message host" entry for a listing. Opens a compose sheet, starts (or
// reuses) a thread with the host, sends the first message, and navigates into it.
// Signed out → routes to sign-in, because messaging needs a real identity on both ends.

export function MessageHostButton({
  hostId,
  listingId,
  listingTitle,
  fullWidth,
}: {
  hostId: string;
  listingId: string;
  listingTitle?: string;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const { user } = useSession();
  const start = useStartThread();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');

  const isDemo = (user?.app_metadata as { demo?: boolean } | undefined)?.demo === true;
  // A demo identity can't message a real host (no server session) — send them to real
  // sign-in rather than fail silently.
  const canMessage = Boolean(user) && !isDemo;

  // A host can't message themselves.
  if (user && user.id === hostId) return null;

  async function onSend() {
    const text = body.trim();
    if (!text) {
      toast.error('Write a message first.');
      return;
    }
    try {
      const threadId = await start.mutateAsync({
        hostId,
        listingId,
        subject: listingTitle,
        body: text,
      });
      setOpen(false);
      setBody('');
      router.push(`/messages/${threadId}`);
    } catch {
      toast.error('Could not start the conversation.');
    }
  }

  return (
    <>
      <Button
        title="Message host"
        variant="outline"
        fullWidth={fullWidth}
        onPress={() => (canMessage ? setOpen(true) : router.push('/sign-in'))}
      />
      <Sheet open={open} onClose={() => setOpen(false)} title="Message the host">
        <VStack className="gap-3">
          {listingTitle ? (
            <Text variant="small" className="text-ink-soft" numberOfLines={1}>
              About: {listingTitle}
            </Text>
          ) : null}
          <Input
            placeholder="Hi! Is early check-in possible? Any questions about the stay…"
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus
          />
          <Button title="Send message" onPress={onSend} loading={start.isPending} />
        </VStack>
      </Sheet>
    </>
  );
}
