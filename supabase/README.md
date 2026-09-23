# HomeOS backend (Supabase)

HomeOS runs in two modes, decided by one file: `src/environments/supabase.config.ts`.

| `supabase.config.ts` | What happens |
| --- | --- |
| blank (default) | Seeded mock data in memory. No sign-in. A refresh resets everything. |
| filled in | Postgres + Storage + Auth. Sign-in required. Data persists. |

Nothing else in the app knows the difference — `core/home-api.ts` picks a
backend and every caller sees the same 15 methods either way.

---

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project**. Pick a region near you
   (for India, Mumbai / `ap-south-1`).
2. Save the database password it asks for — you won't be shown it again.

## 2. Run the schema

Dashboard → **SQL Editor** → paste all of `supabase/migrations/0001_init.sql`
→ **Run**.

That creates eight tables with row level security, a private `documents`
storage bucket, and a trigger that gives every new account a home with three
starter rooms.

You should see `Success. No rows returned`.

## 3. Point the app at it

Dashboard → **Project Settings**:

- **Data API** → Project URL
- **API Keys** → `anon` / publishable key

Put both in `src/environments/supabase.config.ts`:

```ts
export const SUPABASE_CONFIG = {
  url: 'https://xxxxxxxxxxxx.supabase.co',
  anonKey: 'eyJhbGciOi...',
};
```

The anon key is meant to be public — it identifies the project, not a person,
and RLS is what protects the data. The **service role** key is the opposite:
it bypasses RLS completely and must never appear in `src/`.

Restart `npm start`. You'll get the sign-in screen; create an account and
you're on the real backend.

> If email confirmation is on (the default), check your inbox before signing
> in. To skip it while developing: Authentication → Sign In / Providers →
> Email → turn off **Confirm email**.

## 4. Gemini in production (optional until you deploy)

`proxy.conf.js` only runs under `ng serve`. A deployed build has nothing
serving `/api/gemini`, so the AI would fail. `supabase/functions/gemini/`
is the replacement — same job, holds the key server-side.

```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set GEMINI_API_KEY=<your key>
supabase functions deploy gemini
```

The app picks the Edge Function automatically once `supabase.config.ts` is
filled in, and falls back to the dev proxy when it isn't.

---

## How files work

Documents and photos are uploaded to the private `documents` bucket under
`<user-id>/<uuid>-<filename>`. The database stores only that path; storage
policies check the first path segment against `auth.uid()`, so one account
can never read another's invoice.

The app gets **signed URLs**, minted in one batch when the snapshot loads and
valid for 8 hours. That's why `fileUrl` on a document is a URL, not a
`data:` string, once you're on the real backend.

## When something goes wrong

Every write can now fail, and every failure is visible:

- **Modals stay open** with the user's input intact and say what happened,
  just above the button that didn't work.
- **Deletes and toggles** raise an error toast; the list is only updated
  after the backend confirms, so nothing disappears that wasn't deleted.
- **Smart Add saves record by record.** If three of eleven fail, the eight
  that worked are kept and only the failures stay selected, so pressing the
  button again retries without duplicating anything.
- **A failed initial load** shows a banner with a Try again button rather
  than six pages that look like an empty home.

`core/errors.ts` maps backend wording ('violates row-level security policy',
'JWT expired') to something a person can act on.

## Tests

```bash
npm test
```

140 tests, no network required. They cover the date and month arithmetic, the
warranty and reminder rules, the store's derived selectors, failure paths
(state must not change when a write fails), notification derivation, the
Finances month/search/paging logic, the donut geometry, the error mapper,
and — most importantly for this layer — **the row mappers**, which are the
only code that runs solely against a real project.

## What is not here yet

- **Your current mock data isn't imported.** A new account starts with three
  empty rooms. The seed set in `core/mock-data.ts` is still only used in
  mock mode.
- **No integration test against a live project.** Everything above is tested
  with fakes. The first real sign-in is still the first real sign-in.
- **One home per account.** The `homes` table is ready for sharing; nothing
  uses it yet.
- **Signed URLs are minted at load.** A tab open longer than 8 hours needs a
  refresh before images and documents resolve again.
