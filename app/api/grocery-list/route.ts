import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
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

  // Get all recipes owned by this user
  const { data: recipes, error: recipesError } = await supabaseServer
    .from("recipes")
    .select("id, title")
    .eq("user_id", userId);

  if (recipesError) {
    return NextResponse.json({ error: recipesError.message }, { status: 500 });
  }

  if (!recipes || recipes.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const recipeIds = recipes.map((r) => r.id);

  // Get missing ingredients across those recipes
  const { data: ingredients, error: ingredientsError } = await supabaseServer
    .from("recipe_ingredients")
    .select("ingredient_name, amount, recipe_id")
    .in("recipe_id", recipeIds)
    .eq("is_missing", true);

  if (ingredientsError) {
    return NextResponse.json({ error: ingredientsError.message }, { status: 500 });
  }

  // Deduplicate by ingredient name, merge amounts, track which recipes need it
  const recipeTitleById = new Map(recipes.map((r) => [r.id, r.title]));
  const grouped = new Map<string, { name: string; amounts: Set<string>; recipes: Set<string> }>();

  for (const ing of ingredients ?? []) {
    const key = ing.ingredient_name.trim().toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, { name: ing.ingredient_name, amounts: new Set(), recipes: new Set() });
    }
    const entry = grouped.get(key)!;
    if (ing.amount) entry.amounts.add(ing.amount);
    const title = recipeTitleById.get(ing.recipe_id);
    if (title) entry.recipes.add(title);
  }

  const items = Array.from(grouped.values()).map((entry) => ({
    name: entry.name,
    amount: Array.from(entry.amounts).join(", ") || null,
    usedIn: Array.from(entry.recipes)
  }));

  return NextResponse.json({ items });
}