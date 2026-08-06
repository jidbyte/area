"use server";

type GenerateDescriptionInput = {
  name: string;
  brand?: string;
  model?: string;
  categories: string[];
  sellingPrice?: number;
  currency?: string;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat-v3.1";

export async function generateProductDescription(
  input: GenerateDescriptionInput,
): Promise<
  { success: true; description: string } | { success: false; error: string }
> {
  if (!input.name?.trim()) {
    return { success: false, error: "Add a product name first." };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
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
    input.sellingPrice
      ? `Price: ${input.currency ?? ""}${input.sellingPrice}`
      : null,
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
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional, but lets the app show up on OpenRouter's leaderboards.
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
        "X-Title": "Area",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      // Surface a specific, actionable message for rate-limit errors rather
      // than a generic failure — this is the most common failure mode
      // during development on a free-tier key.
      if (response.status === 429) {
        return {
          success: false,
          error: "AI is temporarily rate-limited — please try again in a minute.",
        };
      }
      const errBody = await response.text().catch(() => "");
      console.error("OpenRouter description generation failed:", response.status, errBody);
      return {
        success: false,
        error: "Couldn't generate a description. Try again.",
      };
    }

    const data = await response.json();
    const text: string = data?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      return {
        success: false,
        error: "Couldn't generate a description. Try again.",
      };
    }

    const description =
      text.length > 500 ? text.slice(0, 497).trimEnd() + "..." : text;

    return { success: true, description };
  } catch (err) {
    console.error("OpenRouter description generation failed:", err);
    return {
      success: false,
      error: "Couldn't generate a description. Try again.",
    };
  }
}
