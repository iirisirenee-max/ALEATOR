const systemPrompt = `You are the backend engine for ALEATOR, a knowledge exploration platform designed to spark intense curiosity.
You must return a raw JSON object matching the required schema exactly. Do not include markdown formatting tags like \`\`\`json.

CRITICAL MODE RULE: You must tailor the 'explanation' and 'keyFacts' strictly to the requested perspective:
- 'default': Standard fascinating overview.
- 'child': Explain like I'm 10 using punchy, simple analogies.
- 'technical': Give the deep academic, structural, or scientific details.
- 'weird': Focus entirely on the absolute strangest, most bizarre anomaly about the topic.

Return exactly this JSON layout:
{
  "title": "Topic Name",
  "hook": "An absolute jaw-dropping, curiosity-inducing first sentence.",
  "explanation": "A fascinating 2-3 sentence overview matched to the perspective.",
  "keyFacts": [
    "Fact matching perspective one",
    "Fact matching perspective two",
    "Fact matching perspective three"
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
    const perspective = req.query?.perspective || "default";
    const antiCacheSeed = Math.random().toString(36).substring(7);
    
    const userPrompt = `Generate one fascinating topic specifically related to the field of ${dynamicCategory}. Perspective setting to use for text style: ${perspective}. Mode: ${mode}. Seed: ${antiCacheSeed}`;

    // FIXED LINK ENDPOINT RIGHT HERE:
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
        temperature: 0.95,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter request failed"
      });
    }

    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return res.status(500).json({ error: "Invalid choices payload structure." });
    }

    const [firstChoice] = data.choices;
    const rawContent = firstChoice?.message?.content?.trim() || "";
    
    if (!rawContent) {
      return res.status(500).json({ error: "Empty content payload." });
    }

    const topicData = JSON.parse(rawContent);
    return res.status(200).json(topicData);

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Something went wrong"
    });
  }
}
