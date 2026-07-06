import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";

const fallbackIngredients = ["eggs", "spinach", "tomatoes", "greek yogurt", "chickpeas", "chicken breast"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ingredients: fallbackIngredients,
      mode: "mock",
      note: "Set GEMINI_API_KEY in .env.local to enable real fridge analysis."
    });
  }

  const bytes = Buffer.from(await image.arrayBuffer());
  const model = getGeminiModel();

  const result = await model.generateContent([
    {
      inlineData: {
        data: bytes.toString("base64"),
        mimeType: image.type || "image/jpeg"
      }
    },
    "Detect visible food ingredients in this fridge or pantry image. Return strict JSON only: {\"ingredients\":[\"ingredient name\"]}."
  ]);

  const text = result.response.text().replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(text) as { ingredients?: string[] };
    return NextResponse.json({ ingredients: parsed.ingredients ?? [] });
  } catch {
    return NextResponse.json({ error: "Gemini returned invalid JSON.", raw: text }, { status: 502 });
  }
}
