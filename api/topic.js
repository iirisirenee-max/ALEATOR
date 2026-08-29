export default async function handler(req, res) {
  try {
    const mode = req.query.mode || "random";

    const prompts = {
      random: `
Generate ONE fascinating rabbit-hole topic.
It can be about science, history, language, nature, art,
technology, philosophy, mathematics, culture, or something obscure.

Make it something that would make someone say:
"Wait... WHAT?"

Return ONLY the topic title.
`,

      deep: `
Generate ONE fascinating topic that deserves a deep dive.
Choose something with history, evidence, competing explanations,
and unanswered questions.

Return ONLY the topic title.
`,

      chaos: `
Generate ONE wildly unexpected and obscure topic.
It should feel completely unrelated to anything the user might
normally search for.

Return ONLY the topic title.
`
    };

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://aleator-sable.vercel.app",
          "X-Title": "ALEATOR"
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            {
              role: "user",
              content: prompts[mode] || prompts.random
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenRouter request failed"
      });
    }

    const topic = data.choices?.[0]?.message?.content?.trim();

    if (!topic) {
      return res.status(500).json({
        error: "OpenRouter returned no topic"
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
