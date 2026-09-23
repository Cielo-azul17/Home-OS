# HomeOS — where we left off

Last session: 2026-09-20. Everything below builds clean (`npm run build`) and
`npm test` is green at **140 tests**.

---

## Start here tomorrow

**Connect the Supabase project.** Steps 1–3 of [`supabase/README.md`](supabase/README.md):
create the project, run `supabase/migrations/0001_init.sql` in the SQL editor,
paste the URL + anon key into `src/environments/supabase.config.ts`.

Roughly fifteen minutes, and it turns most of the unknowns below into either
"done" or a real bug report. **Nothing has ever run against a live project** —
the schema has never been executed, and every backend test uses fakes.

While that's happening, the two worth fixing first are **delete confirmations**
and **mobile nav** (both below).

---

## Blocking production

- [ ] **Run the migration.** 300 lines of SQL, never executed once.
- [ ] **Fill in `supabase.config.ts`.** While blank, a production build is the
      mock demo: no sign-in, no persistence.
- [ ] **Deploy + SPA routing.** Angular needs unknown paths rewritten to
      `index.html`, or `/inventory` 404s on refresh and on any shared link.
- [ ] **Deploy the Gemini Edge Function** (`supabase functions deploy gemini`,
      then `supabase secrets set GEMINI_API_KEY=...`). Until then the AI works
      only under `ng serve`, because `proxy.conf.js` doesn't exist in a build.
- [ ] **Password reset.** There is none. A forgotten password currently means a
      permanently locked-out user with nothing you can offer them.
- [ ] **Test the email confirmation flow** end to end, or turn confirmation off
      while developing (Authentication → Sign In / Providers → Email).

## Should not ship with these

- [ ] **Delete confirmations.** One click permanently destroys a document *and*
      its stored file. Survivable with mock data; not now. Audit #3.
- [ ] **Mobile nav hides Finances, Documents and Settings.** The sidebar is
      hidden ≤700px and the bottom bar only shows `NAV_ITEMS.slice(0, 4)`.
      Audit #5.
- [ ] **Needs Attention and Upcoming Reminders rows don't respond to clicks.**
      They're `<button>`s with hover states and no handler; the store even
      computes a `link` per entry that nothing reads. Audit #2.
- [ ] **No client-side image downscaling.** A 12 MB phone photo uploads at full
      size (bucket rejects >20 MB). Slow and expensive on mobile data.
- [ ] **No error monitoring.** When something breaks for a real user you won't
      hear about it — Supabase logs the request, not the browser.

## Before real users

- [ ] **Backups / paid tier.** Free-tier projects **pause after 7 days idle**
      and have no point-in-time recovery. Decide before this holds anyone's
      actual records.
- [ ] **Disclose that invoices go to Google.** Smart Add sends photos of bills —
      names, addresses, serial numbers, prices — to the Gemini API. Users should
      know before they scan, and there should be a data deletion path. India-
      facing means DPDP applies.
- [ ] **Import the existing seed data**, or accept that a new account starts
      with three empty rooms. `core/mock-data.ts` is still mock-mode only.

## Carried over from the audit (lower priority)

- [ ] Route-level lazy loading — bundle is 814 kB raw / 177 kB transfer, and
      `supabase-js` is ~245 kB of it. Budget already raised twice.
- [ ] No focus trap in modals/panels; `Escape` is a document-level listener, so
      stacked overlays all close together.
- [ ] `font-weight: 600` in 5 places but Inter is loaded at `400;500` — those
      render as faux bold.
- [ ] Smart Add can't accept PDFs (`accept="image/*"`), though most real
      invoices are PDFs.
- [ ] Scroll position isn't reset between routes (no `withInMemoryScrolling`).
- [ ] Topbar likely overflows below ~400px — verify on a 375px device.
- [ ] Dead code: `shared/coming-soon/`, `AttentionEntry.link`.

---

## What got built last session

- **Supabase backend layer** — schema with RLS, `SupabaseBackend` (15 methods +
  Storage uploads + batch signed URLs), `HomeApi` as the mock/live switch,
  auth screen, sign-out in the sidebar, Edge Function for Gemini.
- **Store now uses server-issued rows** from every create/update, instead of
  its own `uid()` drafts — this would have silently broken every edit.
- **Error handling on every write.** Modals stay open with input intact and say
  why; deletes and toggles toast; Smart Add saves record-by-record and retries
  only what failed; a failed load shows a retry banner.
- **140 tests** across dates, store rules, failure paths, notifications,
  Finances month/search/paging, donut geometry, row mappers, error mapping.

Two bugs the tests caught while being written: `load()` was a no-op after the
first call, so the retry button only worked by accident (now `reload()`); and
Smart Add hardcoded `image/jpeg` for every upload, mislabelling PNGs and PDFs.
