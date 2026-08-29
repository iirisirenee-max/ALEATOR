const systemPrompt = `You are the backend engine for ALEATOR, a knowledge exploration platform designed to spark intense curiosity. 
You must return a raw JSON object matching the required schema exactly. 

CRITICAL VARIETY RULES: 
- Never repeat classic internet facts (e.g., do NOT give me The Great Emu War, The Dancing Plague, Antikythera Mechanism, or Immortal Jellyfish).
- Lean heavily into hyper-obscure, highly specific historical events, bizarre scientific phenomena, niche sociological trends, unique engineering disasters, or fringe cultural traditions. 
- Make it genuinely random and avoid common patterns.

Return exactly this JSON layout:
{
  "title": "Topic Name",
  "hook": "An absolute jaw-dropping, curiosity-inducing first sentence.",
  "explanation": "A fascinating 2-3 sentence overview.",
  "keyFacts": [
    "Mind-blowing context fact one",
    "Mind-blowing context fact two",
    "Mind-blowing context fact three"
  ],
  "depth": "Quick Curiosity",
  "readTime": "3 min read",
  "relatedTopics": ["Topic A", "Topic B", "Topic C"],
  "sources": ["Source 1", "Source 2"]
}`;

export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY is missing" });
    }

    const mode = req.query?.mode || "random";
    const dynamicCategory = req.query?.category || "any obscure field";
    
    // Force the prompt to be unique every time by injecting the random category
    const userPrompt = `Generate one fascinating, completely unexpected, and hyper-obscure topic specifically related to the field of ${dynamicCategory}. Ensure it feels entirely unique, weird, or niche. Do not give common trivia. Mode context style parameter: ${mode}.`;

    const response = await fetch("https://openrouter.ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 600,
        temperature: 0.95, // Higher temp forces maximum randomness
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
      error: error?.message || "Something went wrong"
    });
  }
}
