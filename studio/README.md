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

## CI

`.github/workflows/studio-ci.yml` builds the standalone Studio application without production credentials and uploads `dist-studio/` as a temporary GitHub Actions artifact. It runs on Studio-related changes to the feature branch and on pull requests to `main`.

## Cloudflare Pages deployment

The production deployment target is a separate Cloudflare Pages project named `ebg-studio`. This lets EBG+ remain on its existing GitHub Pages deployment while Studio receives its own hostname and release lifecycle.

The repository includes `.github/workflows/deploy-studio-cloudflare.yml`. The deployment is intentionally `workflow_dispatch` only until the first production deployment has been verified.

Before running it, configure these GitHub repository values:

### Repository variables

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Repository secrets

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The Cloudflare token needs permission to manage Pages projects/deployments for the selected account.

When manually dispatched, the workflow:

1. installs the repository dependencies;
2. verifies the required Supabase and Cloudflare configuration;
3. builds `dist-studio/`;
4. creates the `ebg-studio` Pages project if it does not already exist;
5. deploys the build to Cloudflare Pages.

After the first deployment, add `studio.ebgplus.app` as a custom domain on the `ebg-studio` Pages project. If DNS is hosted outside Cloudflare, create the CNAME requested by Cloudflare, pointing the Studio subdomain at the project's `pages.dev` hostname.

## Cutover plan

1. Run the Studio CI build and confirm the standalone artifact is healthy.
2. Configure the Cloudflare account ID and API token in GitHub.
3. Manually run `Deploy EBG Studio to Cloudflare Pages`.
4. Add `studio.ebgplus.app` to the Cloudflare Pages project and configure its CNAME.
5. Add the Studio hostname to Supabase Auth redirect/origin settings as needed.
6. Verify staff sign-in, CMS writes, casting updates, poll management, and media uploads.
7. Redirect the legacy `/app/studio` entry from the viewer application to `https://studio.ebgplus.app`.
8. Remove the deploy-time Studio mutation scripts after feature parity is confirmed.

The old embedded Studio remains untouched during the initial cutover.
