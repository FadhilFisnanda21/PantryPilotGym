import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiModel(modelName?: string): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Set GEMINI_API_KEY in .env.local.");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI.getGenerativeModel({ model: modelName ?? "gemini-3.5-flash" });
}

export async function generateWithRetry(
  model: GenerativeModel,
  prompt: string,
  maxRetries = 3,
  delayMs = 2000
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().replace(/```json|```/g, "").trim();
    } catch (err: any) {
      lastError = err;
      const is503 = err?.status === 503 || /503|Service Unavailable|overloaded|high demand/i.test(String(err?.message ?? ""));
      if (is503 && attempt < maxRetries) {
        console.warn(`Gemini overloaded (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
