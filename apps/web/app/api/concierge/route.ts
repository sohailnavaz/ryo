// Ryo AI Concierge — streaming chat endpoint.
//
// POST { messages: {role,content}[], locale?, userId? }  →  streamed NDJSON of
//   {"type":"tool","name":string}   a tool was invoked (for a "looking that up…" hint)
//   {"type":"text","text":string}   an assistant text delta
//   {"type":"error","message":string}
//   {"type":"done"}
//
// Uses the official Anthropic SDK with claude-sonnet-4-6, a manual agentic loop
// (so tools execute server-side with our guardrails), streaming, and prompt
// caching on the frozen system + tool prefix. The API key is read from the
// ANTHROPIC_API_KEY environment variable and never leaves the server.

import Anthropic from '@anthropic-ai/sdk';
import { CONCIERGE_SYSTEM_PROMPT } from './prompt';
import { CONCIERGE_TOOLS, runConciergeTool, type ToolContext } from './tools';
import { checkRateLimit, clientKey } from './guardrails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 6; // stop runaway tool loops
const MAX_MESSAGES = 40; // cap conversation length sent from the client

type WireRole = 'user' | 'assistant';
type IncomingMessage = { role: WireRole; content: string };

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Concierge is not configured (missing ANTHROPIC_API_KEY).' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  // Guardrail: rate limit per client.
  const limit = checkRateLimit(clientKey(req));
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
      status: 429,
      headers: { 'content-type': 'application/json', 'retry-after': String(limit.retryAfterSec) },
    });
  }

  let body: { messages?: unknown; locale?: unknown; userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    return badRequest('`messages` must be a non-empty array.');
  }
  const messages: IncomingMessage[] = rawMessages
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is IncomingMessage =>
        !!m &&
        typeof (m as IncomingMessage).content === 'string' &&
        ((m as IncomingMessage).role === 'user' || (m as IncomingMessage).role === 'assistant'),
    );
  if (messages.length === 0) return badRequest('No valid messages provided.');

  const locale = typeof body.locale === 'string' ? body.locale : 'en';
  const ctx: ToolContext = {
    userId: typeof body.userId === 'string' && body.userId ? body.userId : null,
  };

  const client = new Anthropic({ apiKey });

  // Frozen system prompt = cacheable prefix (tools render before it, so the
  // breakpoint caches tools + system together). The per-request context — locale
  // and sign-in state — goes in a second, uncached system block so it can vary
  // without invalidating the cached prefix.
  const system: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: CONCIERGE_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: `Guest context — preferred locale: ${locale}. Signed in: ${ctx.userId ? 'yes' : 'no'}.`,
    },
  ];

  const convo: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));

      try {
        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const turn = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            tools: CONCIERGE_TOOLS,
            messages: convo,
          });

          turn.on('text', (delta) => send({ type: 'text', text: delta }));

          const final = await turn.finalMessage();

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
          );

          if (final.stop_reason !== 'tool_use' || toolUses.length === 0) {
            break; // end_turn / max_tokens / refusal — we're done
          }

          // Record the assistant turn (with its tool_use blocks) before results.
          convo.push({ role: 'assistant', content: final.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const use of toolUses) {
            send({ type: 'tool', name: use.name });
            const result = await runConciergeTool(use.name, use.input, ctx);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: use.id,
              content: result.content,
              is_error: result.isError,
            });
          }
          convo.push({ role: 'user', content: toolResults });
        }
        send({ type: 'done' });
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? `Concierge error (${err.status ?? 'api'}).`
            : 'The concierge hit an unexpected problem.';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
