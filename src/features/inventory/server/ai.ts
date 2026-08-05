"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

type GenerateDescriptionInput = {
  name: string;
  brand?: string;
  model?: string;
  categories: string[];
  price?: number;
  currency?: string;
};

export async function generateProductDescription(
  input: GenerateDescriptionInput,
): Promise<
  { success: true; description: string } | { success: false; error: string }
> {
  if (!input.name?.trim()) {
    return { success: false, error: "Add a product name first." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "AI description generation isn't configured.",
    };
  }

  const details = [
    `Product name: ${input.name}`,
    input.brand ? `Brand: ${input.brand}` : null,
    input.model ? `Model: ${input.model}` : null,
    input.categories.length
      ? `Categories: ${input.categories.join(", ")}`
      : null,
    input.price ? `Price: ${input.currency ?? ""}${input.price}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Write a compelling e-commerce product description based on the details below.

${details}

Requirements:
- Maximum 500 characters (this is a hard limit — do not exceed it)
- No markdown, no headers, no bullet points — plain prose only
- Persuasive but factual; don't invent specs or claims not implied by the details
- 2-4 short sentences`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const description =
      text.length > 500 ? text.slice(0, 497).trimEnd() + "..." : text;

    return { success: true, description };
  } catch (err) {
    console.error("Gemini description generation failed:", err);

    // Surface a specific, actionable message for quota/rate-limit errors
    // rather than a generic failure — this is the most common failure mode
    // during development on a free-tier key.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      return {
        success: false,
        error: "AI is temporarily rate-limited — please try again in a minute.",
      };
    }

    return {
      success: false,
      error: "Couldn't generate a description. Try again.",
    };
  }
}
