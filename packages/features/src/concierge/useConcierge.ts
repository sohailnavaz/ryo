// Client hook for the Ryo concierge. Streams NDJSON from the concierge API and
// assembles assistant replies token-by-token. Built dependency-free (just React
// + fetch) so it lives in the shared features layer — no next/* imports.
//
// Streaming over fetch works on web today. On native, fetch streaming support
// varies; the hook still functions (it reads whatever arrives) but the endpoint
// must be an absolute URL there. Web passes the default relative path.

import { useCallback, useRef, useState } from 'react';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** A local-only message (e.g. the opening greeting) that is never sent to the model. */
  local?: boolean;
  /** True while this assistant message is still streaming in. */
  pending?: boolean;
};

export type UseConciergeOptions = {
  /** Concierge endpoint. Defaults to the web route. Pass an absolute URL on native. */
  endpoint?: string;
  /** Guest's preferred locale (BCP-47), forwarded so the concierge replies in their language. */
  locale?: string;
  /** Signed-in/demo guest id, or null. Required for write actions (message host, report issue). */
  userId?: string | null;
  /** Optional opening line shown before the guest types anything. */
  greeting?: string;
};

let idCounter = 0;
const nextId = () => `m${Date.now().toString(36)}-${idCounter++}`;

export function useConcierge(options: UseConciergeOptions = {}) {
  const { endpoint = '/api/concierge', locale = 'en', userId = null, greeting } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(
    greeting ? [{ id: nextId(), role: 'assistant', content: greeting, local: true }] : [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const userMsg: ChatMessage = { id: nextId(), role: 'user', content: trimmed };
      const assistantMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '', pending: true };

      // Build the wire history from prior turns (drop local greeting + this
      // empty placeholder) then append the new user turn.
      const history = messages
        .filter((m) => !m.local && !m.pending)
        .map((m) => ({ role: m.role, content: m.content }));
      const wire = [...history, { role: 'user' as const, content: trimmed }];

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setToolActivity(null);

      const appendToAssistant = (delta: string) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m)),
        );
      const finalizeAssistant = () =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, pending: false } : m)),
        );

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: wire, locale, userId }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let msg = 'The concierge is unavailable right now.';
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
          } catch {
            /* keep default */
          }
          setError(msg);
          finalizeAssistant();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const handleEvent = (evt: { type?: string; text?: string; name?: string; message?: string }) => {
          if (evt.type === 'text' && evt.text) {
            setToolActivity(null);
            appendToAssistant(evt.text);
          } else if (evt.type === 'tool' && evt.name) {
            setToolActivity(evt.name);
          } else if (evt.type === 'error') {
            setError(evt.message ?? 'Something went wrong.');
          }
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            try {
              handleEvent(JSON.parse(line));
            } catch {
              /* ignore malformed line */
            }
          }
        }
        if (buffer.trim()) {
          try {
            handleEvent(JSON.parse(buffer.trim()));
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setError('Could not reach the concierge. Check your connection and try again.');
        }
      } finally {
        finalizeAssistant();
        setToolActivity(null);
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [endpoint, locale, userId, messages, isStreaming],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, send, stop, isStreaming, toolActivity, error };
}
