
# MathMentor Restructure (structure-only)
- Components and pages are unchanged.
- Frontend moved to `apps/web`.
- API moved to `apps/api` (from `server/`).
- Vite runs with `--config apps/web/vite.config.ts` on port 3000, proxy `/api/ai` → http://localhost:4000 (same as before).
- TS path aliases updated to point to `apps/web/src`.
## Dev
npm install
npm run dev
## Notes
- If Supabase env vars are missing, the app will throw as before (`src/lib/supabase.ts`).
