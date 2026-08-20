# EBG Studio Audit & Separation Plan

## Audit summary

The repository has two different representations of Studio:

1. `src/App.tsx` on the default branch contains a small embedded `/app/studio` implementation.
2. The production GitHub Pages workflow transforms `src/App.tsx` during deployment by running a long sequence of phase scripts. Later phases rebuild Studio into a much larger management interface.

This means the checked-in `App.tsx` is not the full deployed application. Studio behavior currently depends on deploy-time source mutation.

## Existing backend foundation

The current Supabase layer already provides most of the shared foundation required for a standalone Studio application:

- Supabase Auth sessions and account roles
- staff roles: editor, producer, administrator, founder
- `cms_settings` public reads and staff writes
- casting application staff read/update access
- poll creation/update/delete and result RPCs
- `ebg-media` storage with staff write access
- profiles, watchlist, and playback data for the viewer application

## V1 separation architecture

The first separation keeps the viewer application where it is and adds a second Vite application under `studio/`.

```text
ebgplus/
├── src/                  # viewer app + shared backend helpers
├── studio/               # standalone EBG Studio app
│   ├── src/
│   ├── index.html
│   └── vite.config.ts
├── supabase/
└── package.json
```

Studio intentionally imports the existing backend helper modules rather than creating a second Supabase client implementation.

## Studio V1 workspaces

- Overview / Production dashboard
- Series management
- Episode upload and publishing
- Cast & Talent
- Casting pipeline
- Polls & Voting
- Media management
- Notifications
- Team directory

## Known follow-up work

### 1. Granular role permissions

The database currently treats editor, producer, administrator, and founder as one broad staff group for most protected operations. A later migration should introduce permission-level policies rather than relying only on the UI.

### 2. CMS concurrency

`cms_settings` stores the platform CMS as a large JSON payload. Multiple staff editing simultaneously can create last-write-wins conflicts. Shows, episodes, rails, notifications, and homepage configuration should eventually become normalized tables or use revision-based optimistic concurrency.

### 3. Deployment

The main EBG+ GitHub Pages deployment already owns the repository Pages site. `studio.ebgplus.app` should use a second deployment target sourced from the same repository and pointed at `dist-studio/`.

### 4. Legacy Studio removal

Do not remove `/app/studio` or the Studio phase scripts until the standalone app passes production verification. After cutover, the viewer app should redirect staff to the Studio subdomain and the deploy pipeline should stop mutating Studio into `App.tsx`.
