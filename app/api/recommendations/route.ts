import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getGeminiModel, generateWithRetry } from "@/lib/ai/gemini";

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

  // Fetch user profile and saved recipes
  const [profileResult, recipesResult, weightResult] = await Promise.all([
    supabaseServer.from("profiles").select("goal, height, weight").eq("id", userId).maybeSingle(),
    supabaseServer.from("saved_recipes").select("recipe").eq("user_id", userId).limit(10),
    supabaseServer
      .from("weight_logs")
      .select("weight_kg")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .limit(1)
  ]);

  const profile = profileResult.data;
  const savedRecipes = recipesResult.data ?? [];
  const latestWeight = weightResult.data?.[0]?.weight_kg ?? profile?.weight;

  const savedRecipeNames = savedRecipes
    .map((r: any) => r.recipe?.title ?? "")
    .filter(Boolean);

  const goalDescriptions: Record<string, string> = {
    "weight-loss": "low calorie (under 500 kcal per meal), high fiber, and filling",
    "muscle-gain": "high protein (at least 30g per meal), moderate carbs, and calorie-dense",
    "healthy-eating": "balanced macros, nutrient-dense whole foods, and varied"
  };

  const goalDescription = goalDescriptions[profile?.goal ?? ""] ?? "balanced and nutritious";

  const prompt = `You are a nutrition expert. Generate exactly 3 personalized recipe recommendations for a user with the following profile:

- Goal: ${profile?.goal ?? "healthy eating"}
- Height: ${profile?.height ? `${profile.height} cm` : "not specified"}
- Current weight: ${latestWeight ? `${latestWeight} kg` : "not specified"}
- Recipes already saved (avoid recommending these): ${savedRecipeNames.length > 0 ? savedRecipeNames.join(", ") : "none"}

Recipe requirements: Each recipe should be ${goalDescription}.

Return ONLY a valid JSON array with exactly 3 items. No markdown, no explanation, no preamble. Each item must follow this exact schema:
[
  {
    "title": "Recipe Name",
    "description": "One sentence describing the dish and why it suits the user's goal",
    "calories": 420,
    "protein": 35,
    "carbs": 30,
    "fat": 12,
    "keyIngredients": ["ingredient1", "ingredient2", "ingredient3"],
    "whyRecommended": "One sentence explaining why this fits the user's specific goal and profile"
  }
]`;

  try {
    const model = getGeminiModel();
    const text = await generateWithRetry(model, prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    const recommendations = JSON.parse(clean);

    if (!Array.isArray(recommendations)) {
      throw new Error("Invalid response format from AI.");
    }

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    console.error("Recommendations error:", err);
    const isOverloaded = err?.status === 503 || /503|overloaded|high demand/i.test(String(err?.message ?? ""));
    return NextResponse.json(
      { error: isOverloaded ? "AI is currently busy. Please try again in a moment." : "Failed to generate recommendations." },
      { status: isOverloaded ? 503 : 500 }
    );
  }
}