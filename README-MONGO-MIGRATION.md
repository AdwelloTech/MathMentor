
# MongoDB Migration: Working Features

This patch adds a MongoDB-backed Express API that supports:
- **Subjects dropdown** for instant session (`GET /api/subjects?q={"is_active":true}`)
- **Grade levels** (`GET /api/grade_levels`)
- **Flashcard sets & cards** with dynamic filters (`/api/flashcard_sets`, `/api/flashcards`)
- **Student materials** (tutor materials / study notes) (`/api/tutor_materials`, `/api/study_notes`)
- **Session booking** (`/api/session_bookings`)

## How to run

1. Copy `.env.example` to `.env` and set a valid `MONGODB_URI`.
2. Install deps at repo root:
   ```bash
   npm i
   ```
3. Start the API (port 8080 by default):
   ```bash
   npm run dev:api
   # or
   npm run server
   ```
4. Set your web app to call the new API:
   - Add `VITE_API_URL=http://localhost:8080` to `apps/web/.env`
   - Ensure axios-based libs are used (see below)

## Frontend changes (replace Supabase calls with Axios)

New drop-in axios libs were added in `apps/web/src/lib/`:
- `subjects.api.ts` → fetches active subjects and grade levels
- `flashcards.api.ts` → CRUD for sets/cards
- `studentTutorMaterials.api.ts` → list materials + increment downloads
- `sessionBooking.api.ts` → create/list bookings

Where you previously imported Supabase helpers, swap to the axios versions. Example:

```ts
// before
import { flashcards } from "@/lib/flashcards"; // Supabase

// after
import { listFlashcardSets, listFlashcards, createFlashcardSet } from "@/lib/flashcards.api";
```

## Dynamic query parameters

All list endpoints accept these query params:
- `q` (JSON) → Mongo filter, e.g. `{ "is_active": true, "grade_level_code": "AL" }`
- `sort` (JSON) → e.g. `{ "createdAt": -1 }`
- `limit` (number) → max results (capped at 500)
- `offset` (number) → skip N docs

**Examples:**

```
GET /api/subjects?q={"is_active":true}&sort={"name":1}&limit=200
GET /api/flashcard_sets?q={"tutor_profile_id":"abc"}&sort={"createdAt":-1}
GET /api/flashcards?q={"set_id":"<setObjectId>"}&sort={"card_order":1}
GET /api/study_notes?q={"subject_id":"<subId>","grade_level_code":"AL"}
```

## Minimal data model

The server defines Mongoose schemas for Subjects, GradeLevels, FlashcardSets, Flashcards, StudyNotes, TutorMaterials, and SessionBookings. Extend as needed.

## Health check

```
GET http://localhost:8080/health
```

If you need help swapping specific pages to the axios helpers, ping me with the file paths and I’ll patch them.
