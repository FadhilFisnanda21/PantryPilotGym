import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getGeminiModel, generateWithRetry } from "@/lib/ai/gemini";

export async function POST(request: Request) {
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

  const body = await request.json();
  const userMessage: string = body.message ?? "";
  const chatHistory: { role: "user" | "coach"; text: string }[] = body.history ?? [];

  if (!userMessage.trim()) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  // Fetch user context
  const [profileResult, weightResult, recipesResult] = await Promise.all([
    supabaseServer.from("profiles").select("goal, height, weight").eq("id", userId).maybeSingle(),
    supabaseServer
      .from("weight_logs")
      .select("logged_date, weight_kg")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .limit(7),
    supabaseServer
      .from("saved_recipes")
      .select("recipe")
      .eq("user_id", userId)
      .limit(10)
  ]);

  const profile = profileResult.data;
  const weightLogs = weightResult.data ?? [];
  const savedRecipes = recipesResult.data ?? [];

  const recipeNames = savedRecipes
    .map((r: any) => r.recipe?.title ?? "Unknown")
    .filter(Boolean)
    .join(", ");

  const latestWeight = weightLogs[0]?.weight_kg ?? profile?.weight ?? "unknown";
  const weightTrend = weightLogs.length >= 2
    ? weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg
    : null;

  const systemContext = `You are PantryPilot's personal AI Nutrition Coach. You give concise, practical, and personalized nutrition advice.

User profile:
- Goal: ${profile?.goal ?? "not set"} 
- Height: ${profile?.height ? `${profile.height} cm` : "not set"}
- Starting weight: ${profile?.weight ? `${profile.weight} kg` : "not set"}
- Latest logged weight: ${latestWeight} kg
${weightTrend !== null ? `- Weight trend (last ${weightLogs.length} logs): ${weightTrend > 0 ? "+" : ""}${weightTrend.toFixed(1)} kg` : ""}
- Recently saved recipes: ${recipeNames || "none yet"}

Guidelines:
- Keep responses focused and under 150 words unless the user asks for detail
- Always tie advice back to the user's specific goal
- If asked about recipes, reference their saved ones when relevant
- Be encouraging but honest
- Do not recommend medical treatments or diagnose conditions`;

  const historyText = chatHistory
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.text}`)
    .join("\n");

  const prompt = `${systemContext}

${historyText ? `Previous conversation:\n${historyText}\n` : ""}
User: ${userMessage}
Coach:`;

  try {
    const model = getGeminiModel();
    const reply = await generateWithRetry(model, prompt);
    return NextResponse.json({ reply: reply.trim() });
  } catch (err: any) {
    console.error("Nutrition coach error:", err);
    const isOverloaded = err?.status === 503 || /503|overloaded|high demand/i.test(String(err?.message ?? ""));
    return NextResponse.json(
      { error: isOverloaded ? "AI is currently busy. Please try again in a moment." : "Failed to get a response." },
      { status: isOverloaded ? 503 : 500 }
    );
  }
}