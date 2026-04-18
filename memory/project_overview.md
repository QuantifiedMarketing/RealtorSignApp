---
name: Project Overview
description: SignTrack realtor sign management app — what's been built, fixed, and what's next
type: project
---

React Native Expo app called **SignTrack** for a realtor sign installation business. Two roles: agent (realtor) and admin (operator/installer).

**Why:** Realtors need to request sign installs/removals; the operator needs to manage the queue and track placard inventory.

## Stack
- Expo SDK 54, Expo Router v6 (file-based routing), TypeScript
- React Native 0.81.5, React 19.1.0
- New Architecture enabled (`newArchEnabled: true`)
- react-native-maps for map pin selection
- @react-native-community/datetimepicker for date selection
- Supabase (backend, auth, real-time)
- AsyncStorage for session persistence

## What's Built & Working

### Auth (`context/auth.tsx`)
- Real Supabase auth — `signInWithPassword`, session persistence via AsyncStorage
- Role-based routing: agents → `(tabs)`, admins → `(admin)`
- **Critical pattern:** uses `getSession()` for initial load (outside auth lock), then `onAuthStateChange` for SIGNED_IN/TOKEN_REFRESHED with `setTimeout(0)` to defer DB calls. SIGNED_OUT handled synchronously. Do NOT call `supabase.from()` directly inside `onAuthStateChange` — causes SDK deadlock.
- Demo credentials: agent@test.com / admin@test.com, password: **Password**

### Supabase (`lib/supabase.ts`)
- URL: `https://rsqbvqbxspqiwkmfqupp.supabase.co`
- Anon key is in the file
- Tables: `users`, `jobs`, `placard_inventory`
- RLS enabled on all tables
- Triggers: `sync_placard_count`, `handle_new_user` (auto-creates public.users on auth sign-up)
- Schema file: `supabase/schema.sql`

### Supabase Users (CONFIRMED in DB)
- agent@test.com → UUID `992bc353-7f28-4524-86bd-262b8fb61f02`
- admin@test.com → UUID `57568f29-c84b-42b9-85e2-76c42b2d3b70`
- NOTE: schema.sql seed section still references `11111111...`/`22222222...` UUIDs — these do NOT match the live DB. The live DB UUIDs are the ones above. If schema is re-run from scratch, the seed UUIDs would be `11111111...` and `22222222...`. Current live DB is inconsistent with schema.sql seed — take care if re-seeding.

### Jobs (`context/jobs.tsx`)
- Full Supabase CRUD: submitJob, updateStatus, setJobPhoto
- Real-time subscription (postgres_changes on jobs table)
- rowToJob() maps snake_case DB columns to camelCase Job type

### Agent Screens (`app/(tabs)/`)
- `index.tsx` — Dashboard: live stat cards (placards, active signs, pending), low-placard alert, Submit Job CTA, Recent Jobs list (tappable → job-detail), time-aware greeting
- `explore.tsx` — My Jobs list: status badges, tappable cards → job-detail, "Request Takedown" calls updateStatus correctly
- `profile.tsx` — Shows name, email, brokerage, placard count, low-placard alert, logout. Handles isLoading and null-user states cleanly.

### Submit Job Screen (`app/submit-job.tsx`)
- Address autocomplete → map pin auto-place
- Date picker (native + web)
- MapPinSelector (drag-to-adjust pin)
- Notes (500 char limit)
- Success screen after submission

### Admin Screens (`app/(admin)/`)
- `index.tsx` — Dashboard: live stat cards (pending, active signs, agents, completed), recent submissions list (tappable → job-detail)
- `jobs.tsx` — Filter tabs (All/Pending/Active/Completed), tappable cards → job-detail, inline "Mark Active/Complete" buttons
- `settings.tsx` — Placeholder rows only

### Job Detail (`app/job-detail.tsx`)
- Status transitions: pending → active → completed, takedown_requested → completed
- Photo upload (camera or library) on completion
- Admin and agent can both reach this screen

### Components
- `address-autocomplete.tsx` — Web: OpenStreetMap Nominatim; `.native.tsx` — Google Places API (key in `constants/keys.ts`)
- `map-pin-selector.tsx` — Web stub; `.native.tsx` — react-native-maps with draggable marker

### Theme (`constants/theme.ts`)
- BrandColors: primary #1B4F8A (navy blue), accent #E8A020 (gold), success, warning, error, etc.

## Bugs Fixed This Session

1. **Supabase auth deadlock** — `onAuthStateChange` async callback was calling `supabase.from()` inside the SDK's auth lock → app hung silently and Expo disconnected. Fixed by splitting into `getSession()` for initial load + `setTimeout(0)` deferral for DB calls in `onAuthStateChange`.

2. **Android edge-to-edge tab bar** — `edgeToEdgeEnabled: true` in app.json caused the system gesture navigation strip to overlap the tab bar. The hardcoded `height: 60 / paddingBottom: 6` placed Profile and My Jobs tab buttons inside the Android Home gesture zone — tapping them triggered a Home gesture instead of tab navigation (app appeared to "minimize"). Fixed in both `(tabs)/_layout.tsx` and `(admin)/_layout.tsx` using `useSafeAreaInsets()` to add `insets.bottom` to height and paddingBottom.

3. **`reactCompiler: true` removed** — experimental flag in app.json was breaking class components (had caused a profile screen crash when ErrorBoundary class component was present). Removed entirely.

4. **Agent job cards not tappable** — `explore.tsx` job cards were plain `View`s with no navigation. Changed to `TouchableOpacity` navigating to `/job-detail`.

5. **Greeting not time-aware** — `(tabs)/index.tsx` always said "Good morning". Fixed with a `greeting()` helper checking the hour.

6. **handle_new_user trigger** — Added to `supabase/schema.sql` so new auth signups automatically create a `public.users` profile row from `raw_user_meta_data`.

## What's NOT Done (Next Steps)

1. **Verify tab navigation works** — the Android edge-to-edge fix was just applied; needs confirmation that Profile and My Jobs tabs now navigate correctly
2. **Settings screens** — all rows are placeholders; scheduling, placard inventory management, Stripe not built
3. **Push notifications** — not implemented
4. **30-day sign reminder** — not implemented
5. **Payments/Stripe** — mentioned in settings, not started
6. **Google Places API key restrictions** — key is set in `constants/keys.ts` but has no production restrictions (bundle ID / package name)
7. **schema.sql seed UUID mismatch** — live DB has `992bc353...`/`57568f29...` but schema.sql seed now uses `11111111...`/`22222222...`. Should be reconciled before any fresh re-seed.
