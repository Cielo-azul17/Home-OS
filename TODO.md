# HomeOS — Development Roadmap

Last updated: 2026-09-26. Build clean, **140 tests passing**, all changes pushed.

---

## V1 Status: FEATURE COMPLETE → POLISH (Smart Room Suggestions)

**IN PROGRESS (2026-09-26):**
- [ ] **Smart Room Suggestions** — Gemini suggests missing rooms for extracted items
  - [ ] Update Gemini prompt to return suggested rooms per item
  - [ ] UI: Show suggested room with option to create + allocate
  - [ ] Auto-create rooms when user approves
  - [ ] Handle item reallocation to new rooms

**Completed (2026-09-20 → 2026-09-26):**
- [x] Sequential onboarding: Welcome → Add Rooms → Upload Bills → Review → Explore
- [x] Gemini AI bill extraction (real API integration via Edge Function)
- [x] Full edit interface for extracted items (assets, expenses, documents)
- [x] Auto-increment room names (Bedroom → Bedroom 2 when added twice)
- [x] Room quick-add suggestions (Living Room, Bedroom, Kitchen, Study)
- [x] Delete confirmations across all sections (production safety)
- [x] Progress tracking during bill processing (Bill 1 of N, elapsed time)
- [x] Error handling & retry for failed extractions
- [x] UI/UX polish (spacing, alignment, button layouts)

**Still Blocking Production (from prev session):**
- [ ] **Supabase connection** — Schema never run live, only mock data
- [ ] **SPA routing** — `/inventory` 404s on refresh (needs rewrite rule)
- [ ] **Deploy Gemini Edge Function** — Currently works only under `ng serve`
- [ ] **Password reset** — No recovery flow for forgotten passwords
- [ ] **Email confirmation** — Test end-to-end or disable while developing

---

## V2: Service Management (Act) — IN PROGRESS

### Phase 2.1: MVP (This Sprint)

**UI/Design:**
- [ ] Asset detail: Add "Request Service" button
- [ ] Service request modal/form
  - [ ] Select reason (repair, maintenance, inspection)
  - [ ] Add notes/description
  - [ ] Budget range (optional)
  - [ ] Preferred time window
- [ ] Provider search results page
  - [ ] Display: Name, rating, distance, phone
  - [ ] Map preview (Google Maps embed)
  - [ ] Filter: rating, distance, price
- [ ] Service request tracking page
  - [ ] Status: pending → confirmed → in_progress → done
  - [ ] Timeline view
  - [ ] Contact info + notes

**Backend/Logic:**
- [ ] Data model: `ServiceRequest`, `MaintenanceTask`
- [ ] API routes for service requests (create, update, list)
- [ ] Google Maps API integration (provider search)
- [ ] Maintenance due calculation (warranty expiry + typical service intervals)
- [ ] Auto-reminder 1 day before scheduled service
- [ ] Service history logging

**Integration:**
- [ ] Asset card shows "Needs service?" badge
- [ ] Dashboard "Items Needing Service" widget
- [ ] Add reminders section for maintenance tasks

### Phase 2.2: Enhanced (MVP+1)
- [ ] Provider availability checking
- [ ] Direct booking link generation
- [ ] Service cost estimation
- [ ] Service provider ratings/reviews from Google
- [ ] Recurring maintenance calendar view

---

## V3: Smart Home Insights (Sense) — PLANNED

- [ ] Predictive maintenance (asset age + failure patterns)
- [ ] Usage pattern analysis (when you buy vs when you use)
- [ ] Budget forecasting (upcoming maintenance costs)
- [ ] Smart notifications (warranty expiring in 30 days → suggest service now)

---

## Infrastructure Tasks (All versions)

**Must fix before real users:**
- [ ] Deploy to production (Vercel or similar)
- [ ] SPA routing config
- [ ] Gemini Edge Function deployment
- [ ] Error monitoring (Sentry or Supabase logs)
- [ ] Database backups / paid Supabase tier
- [ ] Data privacy disclosure (Gemini API + DPDP compliance)

**Nice to have:**
- [ ] Route-level lazy loading (bundle: 814 kB → optimize)
- [ ] Image downscaling before upload (mobile data)
- [ ] Focus trap in modals
- [ ] Remove dead code (`coming-soon/`, unused types)

---

## Next Steps (Right Now)

1. **Design V2 UI** — Sketch service request flow
2. **Create data model** — Update Supabase schema for ServiceRequest
3. **Implement backend** — API routes + Google Maps integration
4. **Build frontend** — Forms, search, tracking pages
5. **Test end-to-end** — Full flow from asset → provider selection → booking

---

## Notes

- V1 is solid and ready for real testing (just needs production setup)
- V2 is high-value (what users will actually *do* with their home data)
- Keeping it free: Gemini API (free tier) + Google Maps (free tier)
- No agents needed for V2 — just features + APIs
