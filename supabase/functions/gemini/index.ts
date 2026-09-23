/* Production replacement for proxy.conf.js.
 *
 * proxy.conf.js only exists while `ng serve` is running, so a deployed build
 * has nothing serving /api/gemini and the AI stops working. This function is
 * that endpoint: it forwards the request body to Gemini and attaches the key
 * server-side, exactly as the dev proxy does.
 *
 * The model is the last path segment, so the client keeps its own failover
 * chain rather than duplicating it here.
 *
 * Deploy:
 *   supabase functions deploy gemini
 *   supabase secrets set GEMINI_API_KEY=...
 */

const UPSTREAM = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.6-flash';
/** Mirrors the dev proxy: a model name, nothing that could redirect the URL. */
const ALLOWED = /^[a-zA-Z0-9.\-]+$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: { message: 'Use POST' } }, 405);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return json({ error: { message: 'GEMINI_API_KEY is not set' } }, 500);

  const segment = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '';
  const model = segment && segment !== 'gemini' && ALLOWED.test(segment) ? segment : DEFAULT_MODEL;

  try {
    const upstream = await fetch(`${UPSTREAM}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: await req.text(),
    });

    /* Pass the status through untouched — the client reads 404 to skip a
       retired model and 503 to back off, and swallowing those would break
       its failover. */
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream request failed';
    return json({ error: { message } }, 502);
  }
});
