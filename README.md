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

For a live broadcast, founders and administrators can open `/app/studio/broadcast`,
choose an enabled channel, preview their camera/microphone or supported screen
share, enter a title, and choose Go live. The browser uses WebRTC WHIP to publish
and the viewer uses WHEP to watch. The app provisions the connection automatically;
no OBS installation or manually pasted broadcast URL is needed. Private preview
works before the provider is configured; public broadcasting stays disabled.

One-time provider setup:

1. Enable Cloudflare Stream on the intended Cloudflare account and review its
   usage billing. Create an account-scoped token with Stream edit permission.
2. In the existing Supabase project's Edge Function secrets, set
   `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_STREAM_API_TOKEN`. Never prefix them with
   `VITE_` or add them to public catalog JSON. The runtime supplies the Supabase
   URL and service-role key server-side.
3. Deploy `supabase/functions/browser-broadcast/index.ts` as `browser-broadcast`
   with JWT verification enabled. The function also checks the authenticated user
   and their database role. Only founders/administrators can create, activate,
   refresh, or end their own provider inputs.
4. Open the broadcast desk. Once setup is detected, preview and Go live. The
   channel is activated only after the publisher connection is confirmed.

WHIP publisher credentials are returned only to the authenticated broadcaster and
are not saved in the public catalog. A 90-second lease, refreshed while the
publisher is connected, returns a channel to its schedule after a lost tab or
connection. Explicit stop closes the WebRTC session and deletes the provider
input. WebRTC recording/replay is not offered by this integration. Camera and
microphone permissions require HTTPS or localhost; shared screen audio and screen
capture depend on the browser. A provider-account broadcast still needs a real
integration check after secrets are configured.

Existing external HLS feeds remain available in the channel manager. Use only a
viewer playback URL in that field, never an RTMP server address, stream key, or
API credential. Live coverage preempts the channel schedule; stopping it or
reaching its end time returns to the current program. Prerecorded episodes and
music videos can be scheduled without any live-broadcast provider.

Settings use `cms_settings.value.liveTv` and the existing global-write RLS policy;
no database migration is required. Saves read the latest catalog and use an
`updated_at` comparison to reject concurrent edits, preserving unrelated content.
Viewers receive catalog updates within the existing 30-second refresh interval.
No sample channels or test broadcasts are published automatically.

Run `npm run test:live-tv` for schedule boundaries, live preemption/fallback,
publication filtering, overlap validation, timezone handling, and JSONB equality.
Run `npm run test:broadcast` for server authorization, private publisher credentials,
activation, heartbeat leases, stop cleanup, and concurrent catalog updates. The
deployment workflow runs both suites before publishing.

## Update the visual identity

The public entrance is `src/components/ModernLanding.tsx` with
`src/styles/modern-entrance.css`. The shared vector logo is
`public/branding/ebgplus.svg`, rendered by `BrandLogo`; favicon, touch icon, old
logo URLs, splash, and social card carry the same identity. Preserve show artwork
and show-specific logos independently of the EBG+ platform mark.

The new mobile navigation is `MobileNavigation`, mounted at document.body to keep
fixed controls outside transformed layout ancestors. `platform-mobile.css`,
imported last, controls the shared mobile spacing, navigation, authentication,
channel management, and catalog layouts. Historical mobile classes are no longer
rendered by the new menu. Movies and specials are browsed at `/app/movies` from
catalog titles whose category contains movie, film, special, or documentary.
Licensed titles require actual distribution rights and delivery assets; the app
does not fetch or redistribute another streaming service's catalog automatically.
