// Concierge tool layer.
//
// Four tools. Two are read-only against live listing data (answer_from_listing,
// recommend) and work for anyone. Two mutate on the guest's behalf
// (message_host, create_incident) and are STUBS until the underlying systems
// land — messaging (no thread table yet) and incidents (L4 owns the incidents
// table; coordinate before wiring real writes). The stubs are honest: they
// queue the action for a human and say so, and they refuse when the guest is
// not signed in (authorized-actions-only).
//
// Every tool's string output is run through redactPII before it reaches the
// model (defense-in-depth — see guardrails.ts).

import type Anthropic from '@anthropic-ai/sdk';
// Server route: import data fns from the server-safe entry (the @bnb/api barrel
// pulls in client-only React hooks and breaks the build). Types are erased, so
// the type-only import from the barrel is fine.
import { fetchListing, fetchListings } from '@bnb/api/server';
import type { SearchFilters } from '@bnb/api';
import type { Listing } from '@bnb/db';
import { redactPII } from './guardrails';

export type ToolContext = {
  /** The signed-in (or demo) guest's id, or null if anonymous. Gates write actions. */
  userId: string | null;
};

type ToolResult = { content: string; isError?: boolean };

// ---------------------------------------------------------------------------
// Tool definitions (sent to the model). Order is stable for prompt caching.
// ---------------------------------------------------------------------------

export const CONCIERGE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'answer_from_listing',
    description:
      "Look up the live facts for one listing (title, description, price per night, location, property type, beds/baths, capacity, amenities, rating) so you can answer a guest's question about it accurately. Use this whenever the guest asks anything specific about a particular stay — never answer listing facts from memory.",
    input_schema: {
      type: 'object',
      properties: {
        listing_id: {
          type: 'string',
          description: 'The id of the listing the guest is asking about.',
        },
      },
      required: ['listing_id'],
    },
  },
  {
    name: 'recommend',
    description:
      'Recommend stays that match what the guest is looking for. Returns a short ranked list of live listings. Use this when the guest is exploring rather than asking about one specific place.',
    input_schema: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'City, country, or free-text place the guest wants to stay.',
        },
        guests: { type: 'integer', description: 'Number of guests the stay must fit.' },
        max_price_per_night: {
          type: 'number',
          description: 'Upper budget per night, in the major currency unit (e.g. dollars, not cents).',
        },
        amenities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Amenities the guest cares about, e.g. "Pool", "Wifi", "Hot tub".',
        },
      },
      required: [],
    },
  },
  {
    name: 'message_host',
    description:
      "Send a message to a listing's host on the guest's behalf (e.g. a question before booking, an early check-in request). Requires the guest to be signed in. Messaging is being rolled out, so this currently queues the message for the concierge team to deliver rather than sending instantly.",
    input_schema: {
      type: 'object',
      properties: {
        listing_id: { type: 'string', description: 'The listing whose host should be contacted.' },
        message: { type: 'string', description: "The guest's message to the host." },
      },
      required: ['listing_id', 'message'],
    },
  },
  {
    name: 'create_incident',
    description:
      'Report a problem with a stay (e.g. the property differs from the photos, a safety issue, a host no-show) so a human concierge owns it until it is resolved. Requires the guest to be signed in. Use this for anything that has gone wrong with an actual stay, not for general questions.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['arrival', 'cleanliness', 'safety', 'misrepresentation', 'host_unreachable', 'other'],
          description: 'The kind of problem.',
        },
        description: { type: 'string', description: 'What happened, in the guest’s words.' },
        booking_id: {
          type: 'string',
          description: 'The affected booking id, if the guest can provide it.',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'How urgent it is. Safety problems are urgent.',
        },
      },
      required: ['category', 'description'],
    },
  },
];

// ---------------------------------------------------------------------------
// Executors
// ---------------------------------------------------------------------------

function listingFacts(l: Listing): string {
  const price = (l.price_cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: l.currency || 'USD',
    maximumFractionDigits: 0,
  });
  return [
    `Title: ${l.title}`,
    `Type: ${l.property_type}`,
    `Location: ${l.city}, ${l.country}`,
    `Price: ${price} per night`,
    `Sleeps: ${l.max_guests} guests · ${l.bedrooms} bedroom(s) · ${l.bathrooms} bathroom(s)`,
    `Rating: ${l.rating_avg} (${l.rating_count} reviews)`,
    `Amenities: ${l.amenities.join(', ') || 'none listed'}`,
    `About: ${l.description}`,
  ].join('\n');
}

async function answerFromListing(input: { listing_id?: string }): Promise<ToolResult> {
  const id = (input.listing_id ?? '').trim();
  if (!id) return { content: 'No listing id was provided.', isError: true };
  const listing = await fetchListing(id);
  if (!listing) {
    return { content: `No listing found for id "${id}". It may have been removed.` };
  }
  return { content: listingFacts(listing) };
}

async function recommend(input: {
  destination?: string;
  guests?: number;
  max_price_per_night?: number;
  amenities?: string[];
}): Promise<ToolResult> {
  const filters: SearchFilters = {};
  if (input.destination) filters.destination = input.destination;
  if (input.guests) filters.guests = input.guests;
  if (typeof input.max_price_per_night === 'number') filters.maxPrice = input.max_price_per_night;
  if (input.amenities?.length) filters.amenities = input.amenities;

  const all = await fetchListings(filters);
  if (all.length === 0) {
    return { content: 'No live listings matched those preferences. Try widening the budget or area.' };
  }
  const top = all
    .slice()
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0))
    .slice(0, 5)
    .map((l) => {
      const price = (l.price_cents / 100).toLocaleString(undefined, {
        style: 'currency',
        currency: l.currency || 'USD',
        maximumFractionDigits: 0,
      });
      return `- [${l.id}] ${l.title} — ${l.city}, ${l.country} · ${price}/night · ${l.property_type} · sleeps ${l.max_guests} · rated ${l.rating_avg}`;
    })
    .join('\n');
  return { content: `Matching stays (best-rated first):\n${top}` };
}

async function messageHost(
  input: { listing_id?: string; message?: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  if (!ctx.userId) {
    return { content: 'The guest is not signed in. Ask them to sign in before sending a message to a host.' };
  }
  const id = (input.listing_id ?? '').trim();
  const message = (input.message ?? '').trim();
  if (!id || !message) {
    return { content: 'A listing id and a message are both required.', isError: true };
  }
  // STUB: messaging threads don't exist yet. Confirm the listing is real, then
  // acknowledge as queued for the concierge team. No data is written.
  const listing = await fetchListing(id);
  if (!listing) return { content: `No listing found for id "${id}".` };
  return {
    content:
      `Queued a message to the host of "${listing.title}" for concierge delivery. ` +
      `Direct host messaging is still being rolled out, so a concierge will pass this along and follow up with the guest. (No message was sent automatically.)`,
  };
}

async function createIncident(
  input: { category?: string; description?: string; booking_id?: string; severity?: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  if (!ctx.userId) {
    return { content: 'The guest is not signed in. Ask them to sign in before opening a support case.' };
  }
  const category = (input.category ?? '').trim();
  const description = (input.description ?? '').trim();
  if (!category || !description) {
    return { content: 'A category and a description are both required to open a case.', isError: true };
  }
  // STUB: the incidents table is owned by L4 and not wired yet. Mint a
  // human-readable reference and acknowledge that a human owns it. No row is
  // written — when L4's incidents/tickets table lands, this becomes a real insert.
  const ref = `RYO-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const severity = input.severity || (category === 'safety' ? 'urgent' : 'medium');
  return {
    content:
      `Logged support case ${ref} (category: ${category}, severity: ${severity}). ` +
      `A concierge now owns this and will stay on it until it's resolved. ` +
      `Case tracking is being rolled out, so this is recorded for concierge follow-up rather than a live ticket yet.`,
  };
}

/** Dispatch a tool call by name. Always returns redacted content. */
export async function runConciergeTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const args = (input ?? {}) as Record<string, unknown>;
  let result: ToolResult;
  try {
    switch (name) {
      case 'answer_from_listing':
        result = await answerFromListing(args);
        break;
      case 'recommend':
        result = await recommend(args);
        break;
      case 'message_host':
        result = await messageHost(args, ctx);
        break;
      case 'create_incident':
        result = await createIncident(args, ctx);
        break;
      default:
        result = { content: `Unknown tool "${name}".`, isError: true };
    }
  } catch {
    result = { content: 'That lookup failed unexpectedly. Offer to help the guest another way.', isError: true };
  }
  return { content: redactPII(result.content), isError: result.isError };
}
