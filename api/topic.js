const systemPrompt = `You are the backend engine for ALEATOR, a knowledge exploration platform designed to spark intense curiosity.
You must return a raw JSON object matching the required schema exactly. Do not include markdown formatting tags like \`\`\`json.

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
    const antiCacheSeed = Math.random().toString(36).substring(7);
    
    const userPrompt = `Generate one fascinating, completely unexpected, and hyper-obscure topic specifically related to the field of ${dynamicCategory}. Ensure it feels entirely unique. Mode context parameter: ${mode}. Seed tag string: ${antiCacheSeed}`;

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

    // SAFE EXTRACTOR: Avoids array bracket typos completely
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return res.status(500).json({ error: "Invalid choices payload structure returned from API." });
    }

    const firstChoice = data.choices.shift();
    const rawContent = firstChoice?.message?.content?.trim() || "";
    
    if (!rawContent) {
      return res.status(500).json({ error: "Empty content payload returned from model text segments." });
    }

    const topicData = JSON.parse(rawContent);
    return res.status(200).json(topicData);

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Something went wrong parsing the rabbit hole data."
    });
  }
}
