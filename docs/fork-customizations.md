# Fork customizations and upgrade guide

This repo is a fork of [calcom/cal.diy](https://github.com/calcom/cal.diy). It runs
`cal.ronnieduke.com` and `cal.trailspark.ai` from the same `main` branch, on separate Railway
services with separate Postgres databases. Railway deploys `main` automatically on every push,
so **merging to `main` deploys both sites**.

Remotes: `origin` = `ronnieduke/cal`, `upstream` = `calcom/cal.diy` (push disabled).

Every difference from upstream listed here is intentional. If an upstream change seems to
"fix" one of these back to stock behavior, keep the fork's version unless this document says
the customization can be dropped.

## What the fork changes

### 1. Duplicate calendar invites

The fork started as a fix for duplicate invites. The host calendar is Zoho, and a Gmail
account is connected only to check for conflicts.

| Change | Files | Why |
|---|---|---|
| No organizer ICS when a destination calendar is connected | `packages/emails/lib/generateIcsFile.ts` | Zoho created the event through its API **and** again from the emailed ICS. Zoho's API won't take a custom UID, so the two copies never matched up. |
| ICS sent as a single `text/calendar` part | `packages/emails/lib/convertIcalEventToAlternative.ts`, `packages/emails/templates/_base-email.ts` | nodemailer's `icalEvent` embeds the ICS twice, and Gmail can create an event from each copy. |
| Zoho events sent with `notify_attendee: 0` and **no attendees** | `packages/app-store/zohocalendar/lib/CalendarService.ts` | Zoho emails attendees on external providers even with `notify_attendee: 0`. This is documented Zoho behavior. The attendee list stays in the event description instead. |

Upstream PR [calcom/cal.diy#29600](https://github.com/calcom/cal.diy/pull/29600) adds only
`notify_attendee: 0`. **Don't drop the Zoho change when that PR merges**, because it doesn't
stop invites to external attendees. Keep omitting attendees.

Several booking test expectations were updated to match
(`packages/testing/src/lib/bookingScenario/expects.ts` and the `handleNewBooking` tests).

### 2. Cal Video recording mode

- `DAILY_RECORDING_MODE` (`local` | `cloud` | `off`), resolved in
  `packages/app-store/dailyvideo/lib/resolveRecordingMode.ts` and used by `VideoApiAdapter.ts`.
- The mode is passed from the video page through `cal-video-premium-features.tsx` to
  `startRecording({ type })`, because daily-js defaults to `cloud` otherwise.
- Set it as `NEXT_PUBLIC_DAILY_RECORDING_MODE`. Code that runs inside the app bundle only sees
  `NEXT_PUBLIC_` variables at runtime. The unprefixed name fails silently and records to Daily's
  cloud, which Daily bills for.

### 3. Branding per deployment

Logo and favicon paths, Cal Video colors, the call page logo and background, and the dark-mode
logo inversion are all configurable through env vars. See
[branding-per-deployment.md](./branding-per-deployment.md) for the variables, and for the
upstream branding hooks that don't work on self-hosted installs (so don't try to use them
instead).

Code: `packages/lib/constants.ts`, `packages/ui/components/logo/Logo.tsx`,
`apps/web/lib/video/resolveVideoBranding.ts`, `apps/web/app/(use-page-wrapper)/video/[uid]/page.tsx`,
`apps/web/modules/videos/views/videos-single-view.tsx`, and the brand files in `apps/web/public/`.

> **Never run `biome --write` on `packages/lib/constants.ts`.** It rewrites the file in a way
> that pulls `node:process` into the Edge runtime. Type-check still passes, and only a real
> build shows the failure.

### 4. Start meeting now (instant Cal Video calls)

A **Start meeting now** button on the Bookings page. One click creates an accepted booking that
starts immediately, creates a Cal Video room, copies the guest link and opens the call.

- Service: `packages/features/bookings/services/InstantMeetingService.ts` (+ test, DI module and
  container in `packages/features/bookings/di/`).
- tRPC: `viewer.bookings.startInstantMeeting` in
  `packages/trpc/server/routers/viewer/bookings/startInstantMeeting.handler.ts`.
- UI: `apps/web/modules/bookings/components/StartInstantMeetingButton.tsx`, mounted as the
  `CTA` in `apps/web/app/(use-page-wrapper)/(main-nav)/bookings/[status]/page.tsx`.
- Small additions to upstream files: `createWithReferences` in `BookingRepository.ts`,
  `createWithLocations` in `eventTypeRepository.ts`, the `createMeetingWithCalVideo` export in
  `packages/features/conferencing/lib/videoClient.ts`, and the DI tokens. Plus four strings in
  `en/common.json`.

Design decisions:
- Each booking is attached to a hidden per-user event type (slug `instant-cal-video`, created
  on first use). The recording webhook only sends transcript emails for bookings that have an
  event type. It's also where you set auto-record and transcription for instant calls.
- The room is created with `createMeetingWithCalVideo`, the same function scheduled bookings
  use. The upstream `createInstantCalVideoRoom` checks different plan flags, so instant calls
  would record differently from scheduled ones.
- No calendar event, emails, webhooks or workflows are triggered.
- The 60-minute length is nominal. Daily doesn't remove people already in a call when the room
  expires; it only stops new people joining.

Why the fork builds its own: cal.com's instant meetings (and the v6.7/v6.8 Cal Video features
such as AI notes, the consent dialog and join windows) aren't in cal.diy. Its `connectAndJoin`
endpoint only works for Organization members, and the code that creates instant bookings was
removed.

### 5. Recording and transcription unlock (no Teams UI)

The record and transcribe buttons check `hasTeamPlan`, which just means the user belongs to a
team with a slug. cal.diy has no Teams UI, so run this once per database:

```bash
DATABASE_URL=... node scripts/create-team-selfhost.mjs you@example.com
```

Transcription is Daily's Deepgram service, billed per minute to the Daily account.

### 6. Temporary reverts of upstream commits

| Upstream commit | Fork change | Drop when |
|---|---|---|
| `39c96bc04d` removed the `@ts-expect-error` on `CacheProvider` | Restored in `apps/web/app/providers.tsx` and `apps/web/pages/_app.tsx` | Upstream upgrades `@types/react` past 18.0.26, or `@calcom/web` type-checks without the directive. |

## Upgrading from upstream

```bash
git fetch upstream
git log --oneline main..upstream/main                 # what's new
MB=$(git merge-base main upstream/main)
comm -12 <(git diff --name-only $MB upstream/main | sort) \
         <(git diff --name-only $MB main | sort)       # files both sides changed
git checkout -b chore/sync-upstream-YYYY-MM
git merge upstream/main
```

1. **Generated files:** if `packages/app-store/*.generated.*` conflict, take upstream's
   version (`git checkout upstream/main -- 'packages/app-store/*.generated.*'`). The fork adds
   no apps, so the only differences are formatting. Don't merge them by hand or re-run the
   generator.
2. **Overlapping files:** for anything in the lists above, keep the fork's behavior and bring in
   upstream's other changes around it.
3. **Check upstream PR #29600** and the reverts table. Update this document if anything can
   be dropped.
4. **Verify** (see below), then merge into `main` and push. That push deploys.

### Traps

- **The commit hook rewrites generated files.** `.husky/pre-commit` re-runs the app-store
  generator and `git add`s its output (merge commits skip it). Its Biome step fails because the repo path contains a space ("Claude Code"), and
  the unformatted output gets staged into your commit. After every commit, run
  `git show --stat HEAD`. If `*.generated.*` files appear, restore them from `upstream/main`
  and run `git commit --amend --no-verify`. `turbo run build` rewrites them the same way.
- **Apple Silicon dependencies:** if `node_modules` was installed under x64 Node, Biome and
  Rollup fail with errors that look like code bugs ("Biome formatting failed", "Cannot find
  module @rollup/rollup-darwin-arm64"). Fix: run `yarn install` under arm64 Node.
- **`NEXT_PUBLIC_` prefix:** see section 2. New env vars read by app code need the prefix.

### Verification

```bash
# Fork customizations + whatever upstream touched
TZ=UTC yarn vitest run packages/app-store/zohocalendar packages/emails/lib \
  packages/app-store/dailyvideo apps/web/lib/video packages/features/bookings/services

yarn type-check:ci --force

# Real build (catches Edge-runtime breakage that type-check misses). Run inside apps/web
# so the generator isn't re-run; placeholder values are enough.
cd apps/web && NEXTAUTH_SECRET=x CALENDSO_ENCRYPTION_KEY=build-placeholder-key-000000000 \
  DATABASE_URL=postgresql://u:p@localhost:5432/db yarn build
```

After deploying, check on the live sites:
1. Book a test meeting. Exactly one event should appear on Zoho, and no duplicate invite
   should reach a Gmail attendee.
2. Open the Cal Video page. The branding should be correct, and a local recording shouldn't
   show up as a cloud recording.
3. Click **Start meeting now**. The link should be copied and the guest link should open in a
   private window.
