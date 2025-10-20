// src/api/analyzeAI.js
/**
 * analyzeAI()
 * Sends contract text to OpenAI API and returns structured clause data.
 * Includes safety, cost control, and fallback handling.
 */

export async function analyzeAI(text) {
  // ✅ 1. Safety checks
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: expected plain text.");
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API key. Please configure .env.local.");
  }

  // ✅ 2. Truncate to prevent token overflow & cost spikes
  if (text.length > 6000) {
    console.warn("⚠️ Document truncated to 6000 characters for safety.");
    text = text.slice(0, 6000);
  }

  // ✅ 3. Compose API request
  const endpoint = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: "gpt-4o-mini",
    max_tokens: 500, // cost guard
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a legal document analyzer AI. Extract key clauses and summarize risk.",
      },
      {
        role: "user",
        content: `Analyze the following contract and return JSON only in this exact shape:
{
  "clauses": [
    { "type": "Termination", "start": number, "end": number },
    { "type": "Penalty", "start": number, "end": number },
    { "type": "Confidentiality", "start": number, "end": number }
  ],
  "summary": "Short overall risk summary here"
}
Contract text:
"""${text}"""`,
      },
    ],
  };

  // ✅ 4. Call OpenAI API
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // ✅ 5. Parse response or error context
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error?.message || `${res.status} ${res.statusText}`;
      throw new Error(`OpenAI API Error: ${msg}`);
    }

    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty response from AI model.");

    // ✅ 6. Safely parse model output
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("⚠️ Non-JSON AI output, using fallback summary.");
      parsed = { clauses: [], summary: raw.slice(0, 200) };
    }

    console.log(
      `💰 OpenAI call success at ${new Date().toLocaleTimeString()} | Cost counted once.`
    );
    return parsed;
  } catch (err) {
    console.error("❌ AI analysis failed:", err);
    throw new Error("AI analysis failed. Please retry or check your API key.");
  }
}
