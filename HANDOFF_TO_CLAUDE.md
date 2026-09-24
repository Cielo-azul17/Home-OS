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

### Latest Onboarding Implementation

**Flow**: Welcome screen → Click "Getting Started" → Custom upload modal opens

**Upload modal has 2 tabs:**

1. **Upload Bills tab** - Upload one or multiple images/PDFs
   - Drag/drop or click to select files
   - Shows processing spinner during Gemini OCR
   - Hint text: "Drag multiple files here or click to select"
   - File input has `multiple` attribute for batch uploads

2. **Add Room tab** - Create rooms for asset organization
   - Room name input with inline "Add Room" button (side-by-side layout)
   - Creates rooms with door icon placeholder (no image URL input)
   - List of created rooms with edit/delete buttons
   - "Save Rooms & Continue" button to close modal

**Files involved:**
- `onboarding-wizard.ts` - Main wizard component with 3 steps (welcome/explore/complete)
- `onboarding-upload.ts` - Custom modal with 2-tab upload/room-creation UI
- `onboarding.service.ts` - State tracking for current onboarding step

**Design system compliance:**
- Uses standard button classes: `btn btn-primary`, `btn btn-primary btn-sm`
- Color variables and spacing from design system
- Matches existing dashboard modal styling

## Current Priorities

Start by reading `TODO.md`, `supabase/README.md`, and the files involved in the
specific task. The highest-risk unfinished work is:

1. Verify the Supabase migration against the actual project.
2. Verify authentication and email confirmation end to end.
3. Deploy and test the Gemini Edge Function in production.
4. Add confirmation before destructive deletes.
5. Fix mobile navigation so Finances, Documents, and Settings remain reachable.
6. Make dashboard attention and reminder rows navigate when clicked.
7. Downscale large phone images before upload.
8. Add password reset.
9. Add deployment SPA fallback to `index.html`.
10. Add error monitoring before real users depend on the app.

Other known follow-ups are listed in `TODO.md`: PDF support for Smart Add,
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

## Working Rules for Claude

- Preserve the existing Angular and Supabase architecture unless a change is
  clearly justified.
- Read nearby code and tests before editing.
- Keep changes focused and do not undo unrelated user changes.
- Run a narrow test after each substantive change, then run the broader checks.
- Do not expose credentials in chat, commits, screenshots, or documentation.
- Update `TODO.md` when a tracked production risk is resolved or discovered.
- For UI work, preserve the existing HomeOS design system and verify desktop
  and mobile layouts.

## Message to Give Claude

Copy and send this message:

> You are taking over the HomeOS project in this repository. Read
> `HANDOFF_TO_CLAUDE.md`, `TODO.md`, `supabase/README.md`, and the relevant
> source files before changing anything. HomeOS is an Angular 22 home
> management app with inventory, rooms, reminders, finances, documents,
> notifications, Supabase persistence, and Gemini-powered Smart Add. The
> current branch is `master` and the latest onboarding flow is already pushed.
> Do not expose credentials. First inspect the working tree and run the most
> relevant focused test or build check. Then tell me what you found, identify
> the smallest useful next change, implement it, and validate it. Keep the
> existing architecture and do not revert unrelated changes.

## Good First Prompt After Handoff

If you want Claude to continue the highest-value work, send:

> Start with the production-readiness items in `TODO.md`. Inspect the current
> Supabase configuration and migration without printing credentials. Determine
> whether the app is actually using the live backend, then run the existing
> tests and build. After that, fix the highest-risk small issue you can verify
> locally, preferably destructive delete confirmation or mobile navigation.
> Show me the validation result and any remaining blocker.