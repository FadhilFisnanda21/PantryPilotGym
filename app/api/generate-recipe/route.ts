import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";

type GenerateRecipeBody = {
  ingredients?: string[];
  goal?: string;
};

const fallbackRecipes = [
  {
    title: "High-Protein Fridge Bowl",
    calories: 520,
    protein: 42,
    carbs: 48,
    fat: 18,
    instructions: "Combine your available protein, greens, and pantry carbs. Add a yogurt-based sauce and season to taste.",
    have: ["eggs", "spinach", "tomatoes"],
    need: ["rice", "lemon"]
  }
];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const body = (await request.json()) as GenerateRecipeBody;
  const ingredients = body.ingredients ?? [];
  const goal = body.goal ?? "healthy-eating";

  if (ingredients.length === 0) {
    return NextResponse.json({ error: "ingredients[] is required." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      recipes: fallbackRecipes,
      mode: "mock",
      note: "Set GEMINI_API_KEY in .env.local to enable AI recipe generation."
    });
  }

  const model = getGeminiModel();
  const prompt = [
    "You are PantryPilot, an AI nutrition coach.",
    `Goal: ${goal}`,
    `Available ingredients: ${ingredients.join(", ")}`,
    "Generate 3 practical recipes. Return strict JSON only with this shape:",
    "{\"recipes\":[{\"title\":\"\",\"calories\":0,\"protein\":0,\"carbs\":0,\"fat\":0,\"instructions\":\"\",\"have\":[\"\"],\"need\":[\"\"]}]}"
  ].join("\n");

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(text) as { recipes?: unknown[] };
    return NextResponse.json({ recipes: parsed.recipes ?? [] });
  } catch {
    return NextResponse.json({ error: "Gemini returned invalid JSON.", raw: text }, { status: 502 });
  }
}
