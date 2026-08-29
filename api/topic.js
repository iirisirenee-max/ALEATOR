const systemPrompt = `You are the backend engine for ALEATOR, a serendipitous knowledge exploration platform. 
Your goal is to spark intense curiosity. Never write encyclopedic or dry text. Start with an arresting, unusual hook.
You must return a raw JSON object matching this schema exactly, with no markdown formatting tags like \`\`\`json:
{
  "title": "Topic Name",
  "hook": "An absolute jaw-dropping first sentence.",
  "explanation": "A fascinating 2-3 sentence overview.",
  "keyFacts": [
    "Mind-blowing fact one",
    "Mind-blowing fact two",
    "Mind-blowing fact three"
  ],
  "depth": "Quick Curiosity | Deep Dive | Absolute Chaos",
  "readTime": "3 min read",
  "relatedTopics": ["Topic A", "Topic B", "Topic C"],
  "sources": ["Reputable Source/Publication 1", "Reputable Source/Publication 2"]
}`;

const prompts = {
  random: "Give me one fascinating, unexpected topic from any field of human knowledge. Make it instantly gripping.",
  deep: "Give me one complex, multi-layered topic with rich history and deep structural connections that warrants a massive rabbit hole.",
  chaos: "Give me one wildly bizarre, obscure, or fringe topic that breaks all conventional learning continuity. Make it completely unpredictable."
};

export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY is missing" });
    }

    const mode = req.query?.mode || "random";
    const userPrompt = prompts[mode] || prompts.random;

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
        response_format: { type: "json_object" } // Forces the model to return valid JSON
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter request failed"
      });
    }

    // Clean up the text response just in case the model included markdown blocks
    let rawContent = data?.choices?.[0]?.message?.content?.trim() || "";
    if (rawContent.startsWith("```json")) rawContent = rawContent.replace(/^```json/, "").replace(/```\$/, "").trim();
    if (rawContent.startsWith("```")) rawContent = rawContent.replace(/^```/, "").replace(/```$/, "").trim();

    const topicData = JSON.parse(rawContent);
    return res.status(200).json(topicData);

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Something went wrong parsing the rabbit hole data."
    });
  }
}
