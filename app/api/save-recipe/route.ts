import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseServer } from "@/lib/supabaseServer";

type SaveRecipeBody = {
  recipe?: {
    title: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    instructions: string;
    have?: string[];
    need?: string[];
    ingredients?: string[];
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as SaveRecipeBody;

  if (!body || !body.recipe) {
    return NextResponse.json({ error: "Field 'recipe' is required in the request body." }, { status: 400 });
  }

  const recipe = body.recipe;
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  let userId: string | null = null;

  const supabaseServer = getSupabaseServer();

  if (token && supabaseServer) {
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (!error && data.user) {
      userId = data.user.id;
    }
  }

  if (userId && supabaseServer) {
    try {
      // 1. Insert ke tabel recipes
      const { data: insertedRecipe, error: recipeError } = await supabaseServer
        .from("recipes")
        .insert({
          user_id: userId,
          title: recipe.title,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          instructions: recipe.instructions
        })
        .select("id")
        .single();

      if (recipeError || !insertedRecipe) {
        throw new Error(recipeError?.message ?? "Failed to insert recipe");
      }

      const recipeId = insertedRecipe.id;

      // 2. Insert ingredients (have = is_missing false, need = is_missing true)
      const haveItems = (recipe.have ?? []).map((name) => ({
        recipe_id: recipeId,
        ingredient_name: name,
        amount: null,
        is_missing: false
      }));
      const needItems = (recipe.need ?? []).map((name) => ({
        recipe_id: recipeId,
        ingredient_name: name,
        amount: null,
        is_missing: true
      }));
      const allIngredients = [...haveItems, ...needItems];

      if (allIngredients.length > 0) {
        const { error: ingredientsError } = await supabaseServer
          .from("recipe_ingredients")
          .insert(allIngredients);

        if (ingredientsError) {
          console.warn("Recipe saved, but ingredients failed:", ingredientsError.message);
        }
      }

      return NextResponse.json({ success: true, mode: "supabase", recipeId });
    } catch (err) {
      console.warn("Supabase persistence error, falling back to file:", String(err));
    }
  }

  // Local-file fallback (tetap dipertahankan untuk dev tanpa login)
  const dataDir = path.resolve(process.cwd(), "data");
  const filePath = path.join(dataDir, "saved_recipes.json");

  try {
    await fs.promises.mkdir(dataDir, { recursive: true });

    let existing: unknown[] = [];
    try {
      const raw = await fs.promises.readFile(filePath, "utf8");
      existing = JSON.parse(raw) as unknown[];
    } catch (e) {
      existing = [];
    }

    existing.push(recipe);
    await fs.promises.writeFile(filePath, JSON.stringify(existing, null, 2), "utf8");

    return NextResponse.json({ success: true, mode: "local" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save recipe.", detail: String(err) }, { status: 500 });
  }
}