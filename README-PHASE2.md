# MathMentor — Monorepo + Phase-2 (non-destructive)

This keeps your original **components** and **legacy API** intact, and adds a parallel Phase-2 backend:
- `apps/api/_new` → controllers/services, typed env, pino logging, `/health` route.
- Root ESLint + Prettier + CI workflow.
- No UI changes.

## Run (legacy, unchanged)
```bash
npm run dev
# web → http://localhost:3000
# api (legacy) → your existing server in apps/api/src/index.ts
```

## Run new Phase-2 API (side-by-side)
```bash
npm run dev:api:new
# API (new) → http://localhost:4003  (has /health)
```

Migrate endpoints from your legacy `apps/api/src/index.ts` into `apps/api/_new/modules/*`
when you're ready, then switch the `dev:api` script to point to `_new/index.ts`.
