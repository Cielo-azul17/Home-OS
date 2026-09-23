import { friendlyError } from './errors';

/* Supabase surfaces Postgres, GoTrue and Storage errors verbatim. The user
   should never read 'violates row-level security policy'. */

describe('friendlyError', () => {
  it('explains a dropped connection', () => {
    expect(friendlyError(new TypeError('Failed to fetch'))).toContain('connection');
  });

  it('explains an expired session', () => {
    expect(friendlyError(new Error('JWT expired'))).toContain('session has expired');
  });

  it('translates a row level security rejection', () => {
    expect(friendlyError(new Error('new row violates row-level security policy'))).toBe(
      "You don't have access to that.",
    );
  });

  it('explains a file that is too big', () => {
    expect(friendlyError(new Error('The object exceeded the maximum allowed size'))).toContain(
      '20 MB',
    );
  });

  it('explains a rejected file type', () => {
    expect(friendlyError(new Error('mime type application/zip is not supported'))).toContain(
      'photo or a PDF',
    );
  });

  it('passes through a short unmapped message as the best clue available', () => {
    expect(friendlyError(new Error('Column "colour" does not exist'))).toBe(
      'Column "colour" does not exist',
    );
  });

  it('falls back when the message is a wall of text', () => {
    expect(friendlyError(new Error('x'.repeat(200)))).toBe("That didn't save.");
  });

  it('falls back for a thrown non-error', () => {
    expect(friendlyError(null)).toBe("That didn't save.");
    expect(friendlyError(undefined)).toBe("That didn't save.");
    expect(friendlyError({})).toBe("That didn't save.");
  });

  it('uses the caller\'s fallback wording', () => {
    expect(friendlyError(null, 'Invoice could not be deleted.')).toBe(
      'Invoice could not be deleted.',
    );
  });

  it('reads a thrown string', () => {
    expect(friendlyError('Failed to fetch')).toContain('connection');
  });
});
