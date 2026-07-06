import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseServer } from "@/lib/supabaseServer";

async function readLocalSavedRecipes() {
  const dataDir = path.resolve(process.cwd(), "data");
  const filePath = path.join(dataDir, "saved_recipes.json");

  try {
    const raw = await fs.promises.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as unknown[];
    }
  } catch {
    // Treat missing file or invalid content as empty list
  }

  return [] as unknown[];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    const localRecipes = await readLocalSavedRecipes();
    return NextResponse.json({ recipes: localRecipes.map((recipe) => ({ recipe })) });
  }

  const supabaseServer = getSupabaseServer();
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase server configuration not available." }, { status: 500 });
  }

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid user token." }, { status: 401 });
  }

  const userId = userData.user.id;

  // Ambil recipes milik user, sekaligus join ingredients-nya
  const { data: recipesData, error: recipesError } = await supabaseServer
    .from("recipes")
    .select("id, title, calories, protein, carbs, fat, instructions, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (recipesError) {
    return NextResponse.json({ error: recipesError.message }, { status: 500 });
  }

  const recipeIds = (recipesData ?? []).map((r) => r.id);

  let ingredientsByRecipe: Record<string, { have: string[]; need: string[] }> = {};

  if (recipeIds.length > 0) {
    const { data: ingredientsData, error: ingredientsError } = await supabaseServer
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_name, is_missing")
      .in("recipe_id", recipeIds);

    if (!ingredientsError && ingredientsData) {
      ingredientsByRecipe = ingredientsData.reduce((acc, item) => {
        const key = item.recipe_id;
        if (!acc[key]) acc[key] = { have: [], need: [] };
        if (item.is_missing) {
          acc[key].need.push(item.ingredient_name);
        } else {
          acc[key].have.push(item.ingredient_name);
        }
        return acc;
      }, {} as Record<string, { have: string[]; need: string[] }>);
    }
  }

  const recipes = (recipesData ?? []).map((r) => {
    const ing = ingredientsByRecipe[r.id] ?? { have: [], need: [] };
    return {
      recipe: {
        title: r.title,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        instructions: r.instructions,
        have: ing.have,
        need: ing.need,
        ingredients: [...ing.have, ...ing.need]
      }
    };
  });

  return NextResponse.json({ recipes });
}