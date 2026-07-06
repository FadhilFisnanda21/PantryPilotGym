import { NextResponse } from "next/server";
import { getGeminiModel, generateWithRetry } from "@/lib/ai/gemini";
import { getSupabaseServer } from "@/lib/supabaseServer";

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Senin sebagai awal minggu
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    return NextResponse.json({ error: "Authentication required to view meal plan." }, { status: 401 });
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
  const weekStart = getStartOfWeek(new Date()).toISOString().split("T")[0];

  // 1. Cek apakah sudah ada meal plan untuk minggu ini
  const { data: existingPlan, error: existingError } = await supabaseServer
    .from("meal_plans")
    .select("id, week_start, plan_data")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingPlan) {
    return NextResponse.json({ weekStart: existingPlan.week_start, plan: existingPlan.plan_data, cached: true });
  }

  // 2. Ambil recipe yang sudah disimpan user sebagai bahan rencana
  const { data: savedRecipes, error: recipesError } = await supabaseServer
    .from("recipes")
    .select("title, calories, protein, carbs, fat, instructions")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (recipesError) {
    return NextResponse.json({ error: recipesError.message }, { status: 500 });
  }

  if (!savedRecipes || savedRecipes.length === 0) {
    return NextResponse.json({
      weekStart,
      plan: null,
      message: "Save at least one recipe first so we can build your weekly meal plan."
    });
  }

  // 3. Generate weekly plan pakai Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
  }

  const model = getGeminiModel();

  const prompt = `
You are a nutrition coach. Using ONLY the recipes below, build a 7-day meal plan
(Monday to Sunday) that reuses these recipes across breakfast/lunch/dinner slots
in a balanced way. Respond ONLY with valid JSON, no markdown, in this exact shape:

{
  "days": [
    { "day": "Monday", "breakfast": "<recipe title>", "lunch": "<recipe title>", "dinner": "<recipe title>" },
    ...
  ]
}

Recipes available:
${savedRecipes.map((r) => `- ${r.title} (${r.calories} cal, ${r.protein}g protein)`).join("\n")}
`;

  try {
    const text = await generateWithRetry(model, prompt);
    const planData = JSON.parse(text);

    // 4. Simpan ke Supabase
    const { error: insertError } = await supabaseServer.from("meal_plans").insert({
      user_id: userId,
      week_start: weekStart,
      plan_data: planData
    });

    if (insertError) {
      console.warn("Failed to cache meal plan:", insertError.message);
    }

    return NextResponse.json({ weekStart, plan: planData, cached: false });
  } catch (err: any) {
    console.error("Meal plan generation failed:", err);
    const isOverloaded = err?.status === 503 || /503|Service Unavailable|overloaded|high demand/i.test(String(err?.message ?? ""));
    return NextResponse.json(
      {
        error: isOverloaded
          ? "The AI service is currently busy. Please try again in a minute."
          : "Failed to generate meal plan."
      },
      { status: isOverloaded ? 503 : 500 }
    );
  }
}