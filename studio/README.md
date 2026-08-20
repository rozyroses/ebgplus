# EBG Studio

Standalone creator/producer/staff application for EBG+.

## Architecture

- Separate Vite entry point under `studio/`
- Same repository as the viewer application
- Same Supabase project and environment variables
- Reuses the existing `src/lib/auth.ts`, `src/lib/supabase.ts`, `src/lib/studioData.ts`, and `src/lib/pollData.ts` backend helpers
- Uses the existing EBG staff roles: `editor`, `producer`, `administrator`, and `founder`
- Intended production hostname: `studio.ebgplus.app`

## Local development

From the repository root:

```bash
npm run studio:dev
```

The root `.env` must provide:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Production build

```bash
npm run studio:build
```

The standalone build is emitted to `dist-studio/`.

## Cutover plan

1. Deploy `dist-studio/` to a separate hosting target for `studio.ebgplus.app`.
2. Add the subdomain to Supabase Auth redirect/origin settings as needed.
3. Verify staff sign-in, CMS writes, casting updates, poll management, and media uploads.
4. Redirect the legacy `/app/studio` entry from the viewer application to `https://studio.ebgplus.app`.
5. Remove the deploy-time Studio mutation scripts after feature parity is confirmed.

The old embedded Studio remains untouched during the initial cutover.
