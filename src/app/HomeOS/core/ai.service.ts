import { inject, Injectable } from '@angular/core';
import { Supabase } from './backend/supabase-client';
import { SUPABASE_CONFIG } from '../../../environments/supabase.config';
import {
  AiExtraction,
  ASSET_CATEGORIES,
  DOCUMENT_KINDS,
  EXPENSE_CATEGORIES,
  Room,
} from './models';

/* V1 AI flow: Photo -> Identify -> Suggest -> User confirms -> records created.

   The roadmap's V1 is "Add Anything", so a scan is read for everything it
   implies: a product invoice is an expense, a document AND a new asset.
   This only ever proposes — the design system is explicit that "the AI
   suggests; the user stays in control", so nothing is written here.

   The request goes to /api/gemini, which in development is the dev-server
   proxy in proxy.conf.js that attaches GEMINI_API_KEY server-side. The key
   is never part of the browser bundle. A deployed build needs a real
   endpoint at the same path. */

/* Tried in order. Load spikes are per-model — one can be 503 while the next
   is fine — so after a couple of quick retries we move on rather than
   hammering the same endpoint. The last entry is an alias that always
   resolves to a current flash model, as a backstop if the named ones are
   ever retired. */
const MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

const ATTEMPTS_PER_MODEL = 2;
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function schema(rooms: Room[]) {
  return {
    type: 'OBJECT',
    properties: {
      scanKind: {
        type: 'STRING',
        enum: ['invoice', 'receipt', 'warranty', 'product', 'unknown'],
      },
      summary: { type: 'STRING' },
      confidence: { type: 'NUMBER' },
      groups: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            label: { type: 'STRING' },
            asset: {
              type: 'OBJECT',
              nullable: true,
              properties: {
                name: { type: 'STRING' },
                brand: { type: 'STRING', nullable: true },
                category: { type: 'STRING', enum: ASSET_CATEGORIES },
                roomId: { type: 'STRING', enum: rooms.map((r) => r.id) },
                purchaseDate: { type: 'STRING', nullable: true },
                purchasePrice: { type: 'NUMBER', nullable: true },
                warrantyExpiry: { type: 'STRING', nullable: true },
                serialNumber: { type: 'STRING', nullable: true },
              },
              required: ['name', 'category', 'roomId'],
            },
            expense: {
              type: 'OBJECT',
              nullable: true,
              properties: {
                title: { type: 'STRING' },
                amount: { type: 'NUMBER' },
                date: { type: 'STRING' },
                category: { type: 'STRING', enum: EXPENSE_CATEGORIES },
              },
              required: ['title', 'amount', 'date', 'category'],
            },
            document: {
              type: 'OBJECT',
              nullable: true,
              properties: {
                title: { type: 'STRING' },
                kind: { type: 'STRING', enum: DOCUMENT_KINDS },
              },
              required: ['title', 'kind'],
            },
          },
          required: ['label'],
        },
      },
    },
    required: ['scanKind', 'summary', 'confidence', 'groups'],
  };
}

function instructions(rooms: Room[]): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are the intake step of HomeOS, a home inventory app used in India. Read the attached photo and extract every record it implies.

Today is ${today}. Rooms available (use the id): ${rooms.map((r) => `${r.id} = ${r.name}`).join(', ')}.

Return a list of GROUPS. A group is one purchase, bundling the records it implies:
- asset: the physical thing the household now owns. A service or utility charge is NOT an asset, so those groups have no asset.
- expense: the money actually paid for THIS group. Use the amount payable including tax.
- document: the paper itself, when the image is a bill, invoice, receipt or warranty card. A plain product photo has no document.

How to split into groups:
- Several separate bills in one image -> one group per bill.
- One bill listing several products -> one group per product, each with its own line amount as the expense. Put the document only on the first of those groups.
- A utility or service bill -> one group with an expense and a document, no asset.
- A plain product photo -> one group with just an asset.

label is a short human name for the group, e.g. "IKEA — dining table" or "Electricity bill".

Rules:
- Omit a field rather than inventing it. A warranty card has no price, so no expense.
- Read the actual brand, model, serial number, dates and amounts off the image. Never substitute a different product.
- Do not split one product across groups, and do not merge two products into one group.
- Dates must be YYYY-MM-DD. If the document shows a purchase date, use it; otherwise leave it out.
- If a warranty period is stated (e.g. "2 years"), compute warrantyExpiry from the purchase date.
- confidence is 0-1, reflecting how clearly you can read the image.
- summary is one short sentence describing what the image is.`;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private supabase = inject(Supabase);

  /* Two ways to reach Gemini, same request either way:
       dev      -> /api/gemini/<model>, proxied by proxy.conf.js
       deployed -> the `gemini` Edge Function, which holds the key
     The dev proxy doesn't exist in a built app, so without a project the AI
     only works under `ng serve`. */
  private async endpoint(model: string): Promise<string> {
    if (!this.supabase.configured) return `/api/gemini/${model}`;
    return `${SUPABASE_CONFIG.url}/functions/v1/gemini/${model}`;
  }

  private async headers(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!this.supabase.configured) return headers;

    // Edge Functions verify the caller's JWT before they run.
    const { data } = await this.supabase.db.auth.getSession();
    const token = data.session?.access_token ?? SUPABASE_CONFIG.anonKey;
    headers['Authorization'] = `Bearer ${token}`;
    headers['apikey'] = SUPABASE_CONFIG.anonKey;
    return headers;
  }

  /**
   * @param onStatus called when the call is being retried, so the UI can say
   *   something more useful than a stalled spinner.
   */
  async identify(
    imageDataUrl: string,
    rooms: Room[],
    onStatus?: (message: string) => void,
    signal?: AbortSignal,
  ): Promise<AiExtraction> {
    const comma = imageDataUrl.indexOf(',');
    const base64 = imageDataUrl.slice(comma + 1);
    const mimeType =
      imageDataUrl.slice(5, imageDataUrl.indexOf(';')) || 'image/jpeg';

    const body = JSON.stringify({
      contents: [
        {
          parts: [
            { text: instructions(rooms) },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: schema(rooms),
      },
    });

    let lastStatus = 0;

    for (const [modelIndex, model] of MODELS.entries()) {
      for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
        if (modelIndex > 0 || attempt > 0) {
          onStatus?.('Gemini is busy — trying again…');
        }

        const res = await fetch(await this.endpoint(model), {
          method: 'POST',
          headers: await this.headers(),
          body,
          signal,
        });

        if (res.ok) {
          return this.parse(await res.json(), imageDataUrl);
        }

        // Model retired or unavailable for this endpoint — skip to the next
        // one rather than failing the whole request.
        if (res.status === 404) break;

        lastStatus = res.status;
        if (!RETRYABLE.has(res.status)) {
          const detail = await res.json().catch(() => null);
          throw new Error(detail?.error?.message ?? `Gemini request failed (${res.status})`);
        }

        // Don't sit out a backoff the caller has already walked away from.
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        await wait(700 * (attempt + 1));
      }
    }

    throw new Error(
      lastStatus === 503
        ? 'Gemini is under heavy load right now. This usually clears in a minute — try again.'
        : `Gemini is unavailable right now (${lastStatus}). Try again shortly.`,
    );
  }

  private parse(payload: any, imageDataUrl: string): AiExtraction {
    if (payload.error) {
      throw new Error(payload.error.message ?? 'Gemini returned an error');
    }

    const text = (payload.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .join('');
    if (!text.trim()) throw new Error('Gemini returned an empty response');

    const parsed = JSON.parse(text) as AiExtraction;

    parsed.groups ??= [];

    // The model can't know the file size, so fill that in locally.
    const size = this.approxSize(imageDataUrl);
    parsed.groups.forEach((group, i) => {
      if (group.document) {
        group.document.fileName = `scan-${parsed.scanKind}${i ? `-${i + 1}` : ''}.jpg`;
        group.document.sizeLabel = size;
      }
    });

    return parsed;
  }

  private approxSize(dataUrl: string): string {
    const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
