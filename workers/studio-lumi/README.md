# EBG Studio Lumi Worker

Authenticated bridge between EBG Studio and the existing Lumi AI gateway.

## Security model

The browser sends the signed-in EBG+ Supabase access token to this Worker. The Worker calls `studio_load_cms()` with that same token, so Supabase returns only the productions the account is allowed to access. The requested `showId` must exist in that scoped result before any production context is forwarded to Lumi.

Lumi Studio v1 is suggestion-only. It does not write to `cms_settings`, casting, polls, media, or team-access tables.

## Cloudflare variables

Configure these Worker variables before deploying:

- `SUPABASE_URL` — the EBG+ Supabase project URL.
- `SUPABASE_PUBLISHABLE_KEY` — the EBG+ publishable/anon key used by the Studio client.
- `LUMI_GATEWAY_URL` — the existing Lumi `/chat` gateway URL.
- `ALLOWED_ORIGIN` — defaults in `wrangler.toml` to `https://studio.ebgplus.app`.

After the Worker is deployed, set the Studio build variable `VITE_STUDIO_LUMI_URL` to the Worker endpoint and redeploy EBG Studio.

Do not place provider API keys or Supabase service-role keys in the Studio frontend.
