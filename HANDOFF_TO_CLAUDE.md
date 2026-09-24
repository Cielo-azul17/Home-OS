# HomeOS Project Handoff

Date: 2026-09-24

## What Was Saved in Copilot Memory

There were no saved Copilot memories for this user, session, or repository.
This document is a project handoff assembled from the repository and recent
work so another coding assistant can continue effectively.

## Product

HomeOS is a home-management application. It is intended to give a household
one place to manage:

- Assets and appliances
- Rooms
- Warranties, invoices, manuals, and insurance documents
- Reminders for maintenance and renewals
- Household expenses and finances
- Notifications and smart alerts
- AI-assisted document or bill scanning through Smart Add

The main product idea is: a user uploads a bill or document, Gemini extracts
possible records, and the user reviews and confirms the records before they
are saved.

## Technology

- Angular 22.1.8 with standalone components
- TypeScript 6
- Vitest through Angular's test runner
- Supabase for Postgres, Auth, Storage, and Row Level Security
- Supabase Edge Function for Gemini in production
- Angular dev proxy for Gemini during local development
- GitHub repository: `https://github.com/Cielo-azul17/Home-OS.git`

Useful commands:

```bash
npm install
npm start
npm test
npm run build
npm run build:github
npm run deploy
```

The local app runs at `http://localhost:4200/`.

## Important Architecture

The application is under `src/app/HomeOS/`.

- `core/models.ts`: domain models and shared types
- `core/home-store.ts`: application state, derived selectors, and mutations
- `core/home-api.ts`: common backend API used by the rest of the app
- `core/backend/`: live Supabase implementation and row mappers
- `core/mock-data.ts`: seeded in-memory demo data
- `core/ai.service.ts`: Smart Add AI integration
- `core/notifications.service.ts`: derived notifications
- `shell/`: application shell, sidebar, topbar, and navigation
- `dashboard/`: dashboard screen
- `inventory/`: assets and asset details
- `rooms/`: rooms and room details
- `reminders/`: reminder management
- `finances/`: expenses and financial summaries
- `documents/`: document management
- `settings/`: settings screen
- `add/`: add modals and Smart Add flow
- `onboarding/`: first-run onboarding and upload experience

Routes are defined in `src/app/HomeOS/homeos.routes.ts`:

- `/dashboard`
- `/inventory`
- `/inventory/:id`
- `/rooms`
- `/rooms/:id`
- `/reminders`
- `/finances`
- `/documents`
- `/settings`

## Backend Modes

`src/environments/supabase.config.ts` decides whether the app uses Supabase.

- If the configuration is blank, HomeOS uses mock data in memory. Refreshing
  resets changes and no sign-in is required.
- If the configuration is filled in, HomeOS uses Supabase Auth, Postgres, and
  Storage. Sign-in is required and data persists.

The current repository has Supabase configuration present. Do not copy the
anon key or any other credential into chat or new documentation. Never put a
Supabase service-role key in `src/` or in a browser bundle.

The migration is `supabase/migrations/0001_init.sql`. The setup guide is
`supabase/README.md`. The private `documents` bucket stores files under a
user-specific path, and signed URLs are generated for document access.

The Gemini production function is in `supabase/functions/gemini/`. Production
deployment requires the Supabase CLI, a linked project, and the
`GEMINI_API_KEY` Supabase secret. Local development uses `proxy.conf.js`.

## Recent Work

The current branch is `master`, synchronized with `origin/master`.

Recent commits, newest first:

- (pending) Onboarding upload refinement: 2-tab modal with bill upload & room creation
- (pending) Multiple file upload support
- (pending) Design system button integration
- `9097816` Fix onboarding flow: wait for Smart Add to complete before showing results
- `38f14c4` Adjust onboarding spacing: remove gap between description lines
- `8c52b99` Simplify onboarding: direct upload on first click
- `82b05b6` Rebuild onboarding with AI-first flow
- `69e1847` Add onboarding wizard for new users
- `64f99cd` Add smart alerts system

### Latest Onboarding Implementation (Just Completed)

**Overall Flow:**
1. User signs up → New account, no rooms
2. Shell detects new user (no rooms) and shows onboarding wizard
3. Welcome screen: "Welcome to HomeOS" + "Getting Started" button
4. Click "Getting Started" → Custom upload modal opens
5. User can upload bills OR create rooms, or both
6. After upload completes → "You're All Set!" results screen
7. Results show count of created items + option to "Upload More" or "Explore Dashboard"
8. Click "Explore Dashboard" → Onboarding completes, user goes to main app

**Upload Modal (2 Tabs):**

**Tab 1: Upload Bills** - Upload one or multiple images/PDFs
- Drag/drop or click to select files
- File input has `multiple` attribute for batch uploads
- Shows processing spinner during Gemini OCR
- Hint text: "Drag multiple files here or click to select"
- Processing delay scales with file count (2s + 500ms per file, max 5s)
- Modal closes after processing completes
- Results screen shows with count of created assets

**Tab 2: Add Room** - Create rooms for asset organization
- Room name input with inline "Add Room" button (side-by-side layout using flexbox)
- Creates rooms with door icon placeholder (no image URL input needed)
- List of created rooms with edit/delete buttons
- Edit mode: click edit button, room name loads into input, button changes to "Update"
- Delete removes room from list and cancels edit mode if editing that room
- "Save Rooms & Continue" button closes modal

**Implementation Files:**
- `src/app/HomeOS/onboarding/onboarding-wizard.ts` - Main wizard with 3 steps:
  - `welcome` - Initial greeting screen
  - `explore` - Results screen after upload (not a separate screen step)
  - `complete` - Hidden state, marks onboarding as done
- `src/app/HomeOS/onboarding/onboarding-upload.ts` - Custom modal with 2-tab UI
- `src/app/HomeOS/core/onboarding.service.ts` - State service
- Signal-based: `showUploadModal`, `createdRooms`, `activeTab`
- Effect watches Smart Add modal, but custom upload modal is independent

**Design System Compliance:**
- Uses standard button classes: `btn btn-primary`, `btn btn-primary btn-sm`, `btn btn-ghost`
- CSS variables for colors/spacing (inherited from design system)
- Matches existing dashboard modal styling
- No custom button colors or styles

**What Still Needs Implementation:**
- Gemini OCR integration for bill parsing (currently shows mock processing delay)
- Room image generation/assignment (currently uses door icon placeholder)
- Asset creation from uploaded bills (need to connect Gemini output to store)
- Room persistence to Supabase (create rooms endpoint)
- Smart Add integration with onboarding flow
- Error handling for failed uploads

## Product Roadmap & Phase

**HomeOS evolves through 3 phases:**

### V1: ORGANIZE (Current Phase)
**Tagline:** "Here is your home."

Creates a clear digital representation of everything the user owns and manages.

Features:
- Home inventory & rooms
- Asset details & categories
- Reminders, maintenance & repairs tracking
- Warranty, finances & documents
- AI-powered upload: Photo → Identify → Suggest → User confirms → Asset created
- First-run onboarding experience

Status: ~70% complete. Core features working, onboarding flow added in latest commits.

### V2: ACT (Planned, Not Started)
**Tagline:** "I can help manage it."

Specialized AI agents for repairs and servicing.

Features (DO NOT START):
- Identify repair/service needs
- Find service providers
- Fetch contact details & availability
- Present options
- Book appointments with user approval

### V3: SENSE (Future)
**Tagline:** "I noticed something. Here's what I recommend."

AI Sense connects signals and context to surface insights.

Features (DO NOT START):
- Detect unusual patterns
- Track issues
- Understand context
- Recommend solutions
- Provide clear actions

**CRITICAL:** Current work is V1 only. Do not add V2 or V3 features. Complete V1 gaps first.

## Current Priorities

Start by reading `TODO.md`, `supabase/README.md`, and the files involved in the
specific task. The highest-risk unfinished V1 work is:

1. Verify the Supabase migration against the actual project.
2. Verify authentication and email confirmation end to end.
3. Deploy and test the Gemini Edge Function in production.
4. Add confirmation before destructive deletes (critical for production).
5. Fix mobile navigation so Finances, Documents, and Settings remain reachable.
6. Make dashboard attention and reminder rows navigate when clicked.
7. Downscale large phone images before upload (prevent storage bloat).
8. Add password reset flow.
9. Add deployment SPA fallback to `index.html`.
10. Add error monitoring before real users depend on the app.

Other known V1 follow-ups listed in `TODO.md`: PDF support for Smart Add,
focus trapping in overlays, route scroll restoration, mobile topbar testing,
lazy loading, faux bold font weights, and importing seed data for new users.

## Testing Notes

The repository's last documented state had 140 passing tests and a successful
production build, but Claude should run the checks again before relying on
that claim:

```bash
npm test
npm run build
```

Tests are primarily unit tests with fakes. There has not yet been a complete
integration test against a live Supabase project. Treat the first real sign-in,
upload, storage access, and Gemini request as integration validation.

## Initial Setup (First Time Only)

1. **Configure git author** (if not already done):
   ```bash
   git config user.name "Akash Suryawanshi"
   git config user.email "hds6797@gmail.com"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the dev server:**
   ```bash
   npm start
   ```

4. **Run tests and build:**
   ```bash
   npm test
   npm run build
   ```

5. **Check Supabase connection:**
   - Visit `http://localhost:4200/`
   - App should load without errors
   - Check browser console for any auth/network errors

## Working Rules for Claude

**Architecture & Code:**
- Preserve the existing Angular and Supabase architecture unless a change is
  clearly justified.
- Read nearby code and tests before editing.
- Keep changes focused and do not undo unrelated user changes.
- Do not refactor unrelated code or introduce premature abstractions.

**V1 Scope Only:**
- **DO NOT START V2 FEATURES** (repair agents, service booking)
- **DO NOT START V3 FEATURES** (pattern detection, proactive sensing)
- Focus exclusively on completing V1 gaps listed in TODO.md

**Testing & Validation:**
- Run a narrow test after each substantive change, then run the broader checks.
- Verify both desktop and mobile layouts (use browser DevTools for mobile testing)
- Test authentication flow end-to-end before any auth changes

**Credentials & Security:**
- Do not expose Supabase anon key, service role key, or Gemini API key in chat
- Do not commit credentials to git
- Do not take screenshots of credential-containing screens
- `.env` file is gitignored and should never be committed

**UI & Design:**
- Use only the HomeOS design system for all UI work
- Do not add custom button styles, colors, or spacing
- Use design system CSS variables: `var(--spacing-*)`, `var(--color-*)`
- Use standard button classes: `btn btn-primary`, `btn btn-ghost`, `btn btn-sm`
- Verify mobile layouts work at ≤700px width (sidebar becomes hidden)

**Documentation:**
- Update `TODO.md` when a tracked production risk is resolved or discovered
- Keep this handoff file accurate for the next session
- Document non-obvious design decisions in code comments

## Claude Memory System

The user maintains a persistent memory system at:
`C:\Users\aksur\.claude\projects\c--Users-aksur-my-app\memory\`

This memory tracks:
- **User preferences** (communication style, workflow)
- **Feedback** (what worked, what to avoid)
- **Project context** (ongoing initiatives, deadlines)
- **References** (external systems, tools, contacts)

**Key memories to check:**
- `feedback_design_system_only.md` - Use HomeOS design system for UI only
- `feedback_git_config.md` - Always use "Akash Suryawanshi" as git author
- `project_homeos_roadmap.md` - V1/V2/V3 phases (V1 only currently)
- `project_homeos_backend_stage.md` - Supabase status
- `repo_reference_graph.md` - Directory structure quick reference

The new Claude should read these memories first, then proceed with the handoff.

## First-Time Setup Checklist

Before starting any work:

- [ ] Read `HANDOFF_TO_CLAUDE.md` (this file)
- [ ] Read `TODO.md` at repo root
- [ ] Read user's Claude memory files (see above)
- [ ] Read `supabase/README.md` for backend setup
- [ ] Run `npm install`
- [ ] Run `npm start` and verify app loads at http://localhost:4200/
- [ ] Run `npm test` to verify test suite passes
- [ ] Run `npm run build` to verify production build succeeds
- [ ] Check git config is set to "Akash Suryawanshi" and "hds6797@gmail.com"
- [ ] Verify browser console shows no errors on localhost:4200/

## Message to Give Claude

Copy and send this message to the new Claude account:

> You are taking over the HomeOS project. **IMPORTANT: You are working with a
> new Claude account, not continuing a session.**
>
> **Read first, in this order:**
> 1. Your user's Claude memories at `C:\Users\aksur\.claude\projects\c--Users-aksur-my-app\memory\`
> 2. `HANDOFF_TO_CLAUDE.md` (architecture, recent work, current phase)
> 3. `TODO.md` (production risks and follow-ups)
> 4. `supabase/README.md` (backend setup)
>
> **Project overview:**
> - Angular 22 home management app
> - V1 phase (ORGANIZE): ~70% complete, onboarding just added
> - V2 & V3 not started (do not add these features)
> - Supabase backend with Gemini AI integration
> - Latest work: 2-tab onboarding modal (upload bills + create rooms)
>
> **First actions:**
> 1. Verify working tree: `git status` should show clean or only expected changes
> 2. Install and test: `npm install`, `npm start`, verify http://localhost:4200/ loads
> 3. Run checks: `npm test`, `npm run build`
> 4. Do not expose credentials (Supabase keys, Gemini API key)
> 5. Focus on V1 gaps only (see TODO.md)
>
> After setup, tell me:
> - What you found in git status
> - Test and build results
> - The smallest V1 gap you can tackle first
> 
> Keep the existing architecture. Do not start V2 features.

## Good First Prompts After Initial Setup

**If you want Claude to tackle production-readiness:**

> Now that setup is complete, focus on production readiness. Check TODO.md for
> the highest-risk V1 gaps. Inspect the Supabase configuration (without printing
> credentials) to see if the app is really using the live backend. Pick one
> small fix you can verify locally - ideally "add confirmation before destructive
> deletes" since that blocks production. Show me:
> 1. What the current gap is
> 2. How you'll fix it
> 3. How you'll test it
> Before making changes, get my go-ahead.

**If you want Claude to complete onboarding:**

> The onboarding UI is built but needs backend integration. The current gaps are:
> 1. Connect Gemini OCR to the upload modal (parse bills → extract fields)
> 2. Connect room creation to Supabase (save rooms)
> 3. Create assets from uploaded bills (call Smart Add logic)
> 4. Handle errors gracefully
> Start with the smallest of these - probably room creation. Show me your plan
> and test it locally before pushing.

**If you want Claude to fix mobile navigation:**

> Mobile nav is broken - Finances, Documents, Settings fall off at ≤700px.
> Check TODO.md for the note about this. Verify the issue on DevTools mobile
> mode, then fix it without breaking desktop. Show me the before/after.

**General guidance:**
- Always start with setup verification
- Run tests before and after each change
- Ask the user before major changes
- Focus on V1 gaps only
- Do not start V2 or V3 features
- Preserve the existing architecture