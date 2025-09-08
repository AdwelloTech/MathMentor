# MathMentor Mongo Adapter (ready to run)
1) `cp .env.example .env` then set `MONGO_URL`
2) `npm i`
3) `npm start`  -> API at http://localhost:8000
Endpoints: /api/<collection> (GET/POST/PATCH/DELETE). Models in src/db/models/mathmentor.models.js.
Use the tiny `src/client/supabase-like.js` to keep your app calls similar to Supabase.
