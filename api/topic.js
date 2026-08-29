const systemPrompt = `You are the backend engine for ALEATOR, a knowledge exploration platform designed to spark intense curiosity. 
You must return a raw JSON object matching the required schema exactly. 
CRITICAL RULE: Never reuse or repeat previous placeholder examples like "The Immortal Jellyfish". Every response must generate a completely original, unpredictable topic from diverse fields (e.g., historical anomalies, weird quantum physics, obscure linguistic quirks, forgotten structural engineering feats, bizarre biology, cryptographic mysteries).

Return exactly this JSON layout:
{
  "title": "A highly specific, fascinating topic name",
  "hook": "An absolute jaw-dropping, curiosity-inducing first sentence.",
  "explanation": "A fascinating 2-3 sentence deep-dive overview written with intense personality.",
  "keyFacts": [
    "Mind-blowing context fact number one",
    "Mind-blowing context fact number two",
    "Mind-blowing context fact number three"
  ],
  "depth": "Quick Curiosity",
  "readTime": "3 min read",
  "relatedTopics": ["Distinct Related Topic A", "Distinct Related Topic B", "Distinct Related Topic C"],
  "sources": ["Reputable Scientific/Historical Source 1", "Reputable Scientific/Historical Source 2"]
}`;

const prompts = {
  random: "Generate one fascinating, completely unexpected niche topic from any domain of human history or science. Do not repeat previous topics.",
  deep: "Generate one complex, multi-layered historical or scientific structural mystery that warrants a massive, endless rabbit hole exploration.",
  chaos: "Generate one wildly bizarre, obscure, or fringe reality anomaly that breaks all conventional learning continuity. Make it completely unpredictable."
};

export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY is missing" });
    }

    const mode = req.query?.mode || "random";
    const userPrompt = prompts[mode] || prompts.random;

    // Use a tiny bit of random padding to force the model to reset its context generation cache
    const antiCacheSeed = Math.random().toString(36).substring(7);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userPrompt} (Seed context token identifier: ${antiCacheSeed})` }
        ],
        max_tokens: 600,
        temperature: 0.85, // Bumped up variation temperature to destroy patterns
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter request failed"
      });
    }

    const rawContent = data?.choices?.[0]?.message?.content?.trim() || "";
    const topicData = JSON.parse(rawContent);
    return res.status(200).json(topicData);

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Something went wrong parsing the rabbit hole data."
    });
  }
}
