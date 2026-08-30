const systemPrompt = `You are the backend engine for ALEATOR, a knowledge exploration platform designed to spark intense curiosity.
You must return a raw JSON object matching the required schema exactly.
Do not include markdown.
Do not use code fences.
Return ONLY valid JSON.

Return exactly this structure:
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

    const userPrompt = `
Generate one fascinating, completely unexpected, and specific topic related to the broad field of "${dynamicCategory}".
Mode: ${mode}
The topic should feel unique, surprising, and genuinely worth falling down a rabbit hole about.
Do not give a generic subject. Give a specific phenomenon, event, object, idea, mystery, person, discovery, place, tradition, experiment, or connection.
Return only the required JSON object.
`;

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

    // BULLETPROOF ARRAY DETECTION BUGFIX
    let rawContent = "";
    if (data?.choices && data.choices.length > 0) {
      rawContent = data.choices[0]?.message?.content?.trim() || "";
    } else if (data?.choices?.message?.content) {
      rawContent = data.choices.message.content.trim();
    }

    if (!rawContent) {
      return res.status(500).json({ error: "Empty content payload returned from OpenRouter response layers." });
    }

    // Clean up any rogue markdown code blocks if the AI ignored response_format
    if (rawContent.startsWith("```")) {
      rawContent = rawContent.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    let topicData;
    try {
      topicData = JSON.parse(rawContent);
    } catch (parseError) {
      return res.status(500).json({ error: "Model text failed to parse into valid JSON object structure." });
    }

    return res.status(200).json({
      title: topicData.title || "Unknown Horizon",
      hook: topicData.hook || "A mystery waiting to unfold.",
      explanation: topicData.explanation || "No background description was provided for this trail entry.",
      keyFacts: Array.isArray(topicData.keyFacts) ? topicData.keyFacts : ["An unmapped discovery point."],
      depth: topicData.depth || "Quick Curiosity",
      readTime: topicData.readTime || "3 min read",
      relatedTopics: Array.isArray(topicData.relatedTopics) ? topicData.relatedTopics : [],
      sources: Array.isArray(topicData.sources) ? topicData.sources : []
    });

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Something went wrong parsing the rabbit hole data."
    });
  }
}
