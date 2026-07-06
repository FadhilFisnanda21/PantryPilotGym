const fs = require('fs');
const path = require('path');
const root = process.cwd();
const treePath = path.join(root, 'PROJECT_MAP_TREE.txt');
const outputPath = path.join(root, 'PROJECT_MAP.md');
if (!fs.existsSync(treePath)) {
  throw new Error('PROJECT_MAP_TREE.txt not found');
}
const tree = fs.readFileSync(treePath, 'utf8');
const content = [
  '# Project Map',
  '',
  'This file documents the current project structure for PantryPilot AI Nutrition Coach, excluding `node_modules`, `.next`, and `.git`.',
  '',
  '## Important files',
  '',
  '- `app/api/analyze-fridge/route.ts`: analyzes a fridge image via Gemini Vision and returns detected ingredients.',
  '- `app/api/generate-recipe/route.ts`: generates recipes from available ingredients and the selected goal using Gemini.',
  '- `app/api/meal-plan/route.ts`: builds or fetches a weekly meal plan from saved recipes using Gemini and caches it.',
  '- `app/api/save-recipe/route.ts`: saves a recipe to Supabase with normalized tables and falls back to local storage if needed.',
  '- `app/api/saved-recipes/route.ts`: retrieves saved recipes from Supabase or local file fallback.',
  '- `app/layout.tsx`: root Next.js layout component that wraps the app.',
  '- `app/page.tsx`: main homepage component and user workflow UI.',
  '- `lib/supabase.ts`: creates a browser Supabase client for public operations.',
  '- `lib/supabaseBrowser.ts`: initializes Supabase client in the browser with session persistence.',
  '- `lib/supabaseServer.ts`: initializes Supabase server client with a service role key for server-side operations.',
  '- `supabase/schema.sql`: defines the Postgres schema for profiles, recipes, recipe_ingredients, meal_plans, and RLS policies.',
  '',
  '## Project tree',
  '',
  '```',
  tree.trim(),
  '```',
].join('\n');
fs.writeFileSync(outputPath, content, 'utf8');
console.log('PROJECT_MAP.md created');
