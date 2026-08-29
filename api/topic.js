export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: `You are ALEATOR, a curiosity engine.
Generate ONE fascinating rabbit-hole topic.
It can be about science, history, language, nature, art, technology, philosophy, mathematics, culture, or something obscure.
Avoid generic topics.
Return ONLY the topic title, nothing else.`
      })
    });

    const data = await response.json();

    res.status(200).json({
      topic: data.output_text
    });

  } catch (error) {
    res.status(500).json({ error: "Something went wrong." });
  }
}
