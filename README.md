# PantryPilot AI Nutrition Coach

PantryPilot turns fridge ingredients into nutrition-focused meals for weight loss, muscle gain, and healthy eating.

## Current State

- Static MVP remains available through `index.html`.
- Next.js app scaffold is now available in `app/`.
- Gemini API routes include mock fallback responses when `GEMINI_API_KEY` is not set.
- Supabase schema is available in `supabase/schema.sql`.

## Run Next.js

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill:

```bash
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## API Routes

- `POST /api/analyze-fridge`
  - form-data: `image`
  - output: `{ ingredients: string[] }`

- `POST /api/generate-recipe`
  - JSON: `{ "ingredients": ["eggs", "spinach"], "goal": "weight-loss" }`
  - output: `{ recipes: [...] }`

- `POST /api/save-recipe`
  - JSON: `{ "recipe": { /* recipe object from the UI */ } }`
  - Persists to `data/saved_recipes.json` in the project root (development/local fallback).

## Build & Verify

Run a production build and check type/lint validity:

```bash
npm install
npm run build
```

Dev server:

```bash
npm run dev
```

Notes:
- If `GEMINI_API_KEY` is not set the app will use local sample detections for `analyze-fridge` and `generate-recipe`.
- To enable user persistence using Supabase, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and I can implement server-side Supabase writes next.
