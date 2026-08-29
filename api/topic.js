const prompts = {
  random:
    "Give me one fascinating, unexpected topic to learn about. It can come from ANY field: science, history, psychology, technology, nature, culture, art, philosophy, geography, economics, language, or something obscure. Make it genuinely interesting and specific. Return ONLY the topic title, nothing else.",

  deep:
    "Give me one fascinating topic that is worth going down a deep rabbit hole about. It should have layers, history, surprising connections, and plenty to explore. It can come from ANY field. Return ONLY the topic title, nothing else.",

  chaos:
    "Give me one completely unexpected topic to learn about. Make the choice chaotic, weird, surprising, and unrelated to what someone would normally expect. ANY subject is allowed. Return ONLY the topic title, nothing else."
};

export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY is missing"
      });
    }

    const mode = req.query?.mode || "random";

    const response = await fetch(
      "https://openrouter.ai/api/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          input: prompts[mode] || prompts.random,
          max_output_tokens: 100
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error?.message ||
          data.error ||
          "OpenRouter request failed"
      });
    }

    const topic =
      data.output_text?.trim() ||
      data.output?.[0]?.content?.[0]?.text?.trim() ||
      data.output?.[0]?.content?.[0]?.text?.value?.trim() ||
      data.choices?.[0]?.message?.content?.trim();

    if (!topic) {
      return res.status(500).json({
        error: "No topic returned",
        debug: data
      });
    }

    return res.status(200).json({
      topic
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Something went wrong"
    });
  }
}
