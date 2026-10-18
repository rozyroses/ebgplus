# EBG+

EBG+ viewer application, built with React, TypeScript, Vite and Supabase.

## Run locally

Use Node 22.12 or newer (`nvm use` selects Node 22).

```sh
npm ci
cp .env.example .env.local
# Fill in your Supabase project URL and public anon key in .env.local.
npm run dev
```

Never use a Supabase service-role key in a browser app. Without configuration the
UI can build, but authenticated and database-backed features require Supabase.

## Build and deploy

```sh
npm run build
npm run preview
```

The build typechecks the committed source and produces `dist`, including the
GitHub Pages `404.html` fallback. It does not rewrite application source.
Pull requests targeting main run the same build. Main pushes deploy to GitHub
Pages only after building successfully. Manual runs deploy only from main.

One-time repository settings:

1. Settings > Pages > Source: **GitHub Actions**.
2. Settings > Secrets and variables > Actions > Variables: set
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the existing project values.
3. Keep the custom domain `ebgplus.app` in Pages settings and its DNS records at
   the domain provider. Domain routing is separate from a successful build.
4. Keep the production origin and password-reset callback URLs configured in
   Supabase Auth. Existing schema, storage policies and migrations still apply.

The workflow reports missing deployment variables before building. PR builds do
not need production variables; a green PR does not verify live sign-in, database
permissions, media playback, or DNS. GitHub Pages uses the SPA document as its 404
fallback, so direct app-route loads render but retain an HTTP 404 status.

## Source of truth

`src/App.tsx` now contains the integrated viewer app through Phase 1.61. Previously,
Actions reconstructed it with dozens of ordered patch scripts on every deploy.
Edit source directly from now on. The historical `apply-*.mjs` and
`prepare-phase112.mjs` files remain for reference only; do not rerun them or add
them back to CI. Supabase SQL files are retained and are not applied by builds.

The standalone Studio redesign is still on `redesign/studio-ink-blue` (PR #17,
base `feat/ebg-studio-app`); Forms has its own repository/deployment. This repair
stabilizes the main viewer repository and does not merge those separate apps or
change their live domains. It also does not import the separately hosted website
redesign into this GitHub application.

## Live TV

Viewers can open `/app/live-tv` from the desktop sidebar or mobile tabs. The
channel guide shows current and upcoming programs in the viewer's local timezone.
The player joins scheduled videos at their wall-clock position, advances between
programs, and periodically corrects playback drift. Schedule gaps show off air.

Founders and administrators manage the network lineup at `/app/studio/live-tv`
(also linked from the viewer). Create a channel, select published episodes or
music videos, and enter each program's start time and actual runtime. Overlapping
slots are rejected. Enable channel visibility and save to publish the lineup.
Draft, archived, deleted, and unreleased videos are excluded from playback.

For a live broadcast, use a streaming service/encoder to produce a public HTTPS
HLS playback URL. Preview that viewer URL in the broadcast desk, mark the feed
on air, and save. Live coverage preempts the channel's schedule. Stopping it or
reaching an optional end time returns to the current scheduled program. Browser
codec support, HTTPS, CORS, and a working feed are required. Ingest, transcoding,
stream-key provisioning, and broadcasting directly from the browser are not
provided by this viewer application. Never put a stream key or API credential in
the playback-URL field.

Settings use `cms_settings.value.liveTv` and the existing global-write RLS policy;
no database migration is required. Saves read the latest catalog and use an
`updated_at` comparison to reject concurrent edits, preserving unrelated content.
Viewers receive catalog updates within the existing 30-second refresh interval.
No sample channels or test broadcasts are published automatically.

Run `npm run test:live-tv` for schedule boundaries, live preemption/fallback,
publication filtering, overlap validation, timezone handling, and JSONB equality.
The deployment workflow runs these checks before publishing.

## Update the visual identity

The current cool-white / ink / electric-blue viewer theme is in
`src/styles/viewer-theme.css`, imported last by `src/main.tsx`. Adjust its opening
CSS tokens for palette, corner radius and sidebar width. The existing approved
ink-blue logo is `public/branding/ebgplus-ink-blue.png`. The viewer has desktop
sidebar navigation and active mobile tabs; authentication and CMS services stay
in their existing modules. Keep imagery and media-player foregrounds readable
when changing the theme.
