/* Turning whatever a backend threw into something a person can act on.

   Supabase surfaces Postgres, PostgREST, GoTrue and Storage errors, plus the
   browser's own network failures. Left raw, the user gets things like
   'JWT expired' or 'duplicate key value violates unique constraint'. */

const FRIENDLY: { match: RegExp; message: string }[] = [
  {
    match: /failed to fetch|networkerror|network request failed/i,
    message: "Couldn't reach the server. Check your connection and try again.",
  },
  {
    match: /jwt|token|not signed in|session/i,
    message: 'Your session has expired. Sign in again to continue.',
  },
  {
    match: /row-level security|permission denied|violates row/i,
    message: "You don't have access to that.",
  },
  {
    match: /duplicate key|already exists/i,
    message: 'That already exists.',
  },
  {
    match: /payload too large|exceeded the maximum|file size/i,
    message: 'That file is too large. The limit is 20 MB.',
  },
  {
    match: /mime type|not supported/i,
    message: "That file type isn't supported. Use a photo or a PDF.",
  },
  {
    match: /timeout|timed out/i,
    message: 'That took too long. Try again in a moment.',
  },
];

export function friendlyError(error: unknown, fallback = "That didn't save."): string {
  const raw =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  if (!raw) return fallback;

  for (const { match, message } of FRIENDLY) {
    if (match.test(raw)) return message;
  }

  /* An unmapped message is still better than a generic one — it's the only
     clue when something unexpected breaks in production. */
  return raw.length <= 140 ? raw : fallback;
}
