# EBG+ Supabase setup

This branch introduces the secure backend foundation for EBG+ without changing the current public demo experience yet.

## 1. Create a dedicated Supabase project
Use a separate project for EBG+ rather than sharing a database with another app.

## 2. Run the database schema
Open the Supabase SQL editor and run `supabase/schema.sql`.

The schema creates:
- accounts and server-side roles
- viewing profiles
- watchlists
- playback progress
- casting applications
- CMS settings
- row-level security policies

Important: new accounts always start as `viewer`. Founder/admin access must be granted explicitly in the database; the browser can no longer promote itself.

## 3. Add frontend environment values
Set these values in your local `.env` file from the project API settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Only use the public/anon client key in the frontend. Never place a service-role key in this repository or in browser code.

## 4. GitHub Pages deployment
For the production Pages build, add repository secrets or variables for the same two values and expose them to the Vite build workflow.

## 5. Next integration step
Wire the existing sign-up/sign-in/profile/watchlist/playback/casting/CMS UI to `src/lib/supabase.ts`, then remove the localStorage account and authorization model.
