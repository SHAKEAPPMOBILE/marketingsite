// SHAKE marketing-site voice/text concierge.
// Stateless: the client keeps conversation history and re-sends it each turn.
// Uses Claude's hosted web_search tool so "what's popping this weekend" can
// pull real, current results (including Instagram/Luma/Eventbrite listings)
// without us running our own search/scrape pipeline.
// Voice is synthesized here (ElevenLabs) rather than left to the browser's
// own speechSynthesis, which sounds robotic and varies wildly by OS.

const SYSTEM_PROMPT = [
  "You are SHAKE's voice concierge, embedded on SHAKE's own marketing website (shakeapp.today). SHAKE is an app for meeting people through real, in-person plans — dinner, brunch, drinks, and plans people create themselves — in cities around the world.",
  "",
  "A visitor is talking to you, by voice or text, before they've downloaded the app. Your job: help them discover what's actually happening in their city — concerts, events, sports, wellness, nightlife, anything worth going to — using web search (check general results, Instagram, Luma, and Eventbrite listings when relevant).",
  "",
  "Rules:",
  "- If you don't know the visitor's location yet, do not guess or search generically. Reply with exactly this sentence and nothing else: \"You're not sharing your location in your browser — let me know where you'd like me to search.\"",
  "- If the visitor's message is vague (a greeting, or no clear interest), ask one short clarifying question, e.g. \"What are you in the mood for — food, music, sports, wellness, something else?\" Do not search yet.",
  "- Once you have both a location and a clear interest, search the web for real, current things happening there this week or weekend. Give 2-4 concrete, specific suggestions — name, day/time if you found it, one short line on what it is. Prefer real event listings (Instagram posts, Luma, Eventbrite) and recent results over generic tourism pages.",
  "- Keep replies short and conversational — this is read aloud by text-to-speech. No markdown, no bullet points, no headers, no long URLs spoken aloud.",
  "- Do not write your own closing call-to-action or sign-off line — one is appended automatically after your answer. Just answer or ask the clarifying question, then stop.",
  "- Tone: warm, brief, a little playful. Never corporate, never robotic, never apologetic about being an AI.",
].join("\n");

// Fixed, exact wording — always this lead-in, one of these endings picked at
// random each reply. Not left to the model to improvise.
const CLOSING_LINES = [
  "why don't you open the SHAKE-SOCIAL app and get hip",
  "why don't you open the SHAKE-SOCIAL app and turn yourself on",
  "why don't you open the SHAKE-SOCIAL app and flip the switch",
  "why don't you open the SHAKE-SOCIAL app and put your velvet on",
  "why don't you open the SHAKE-SOCIAL app and fuck yourself",
  "why don't you open the SHAKE-SOCIAL app and catch the vibe",
];

function pickClosingLine() {
  return CLOSING_LINES[Math.floor(Math.random() * CLOSING_LINES.length)];
}

const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // "Bella" — warm, expressive default; override via env once you've picked a voice you like in ElevenLabs' library.

async function synthesizeSpeech(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errText);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString("base64");
  } catch (err) {
    console.error("ElevenLabs TTS request failed:", err);
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("voice-agent: ANTHROPIC_API_KEY not configured");
    res.status(500).json({ error: "Voice agent not configured" });
    return;
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const rawHistory = Array.isArray(body && body.history) ? body.history : [];
  const location = typeof (body && body.location) === "string" ? body.location.trim().slice(0, 200) : null;

  const messages = rawHistory
    .slice(-10)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    res.status(400).json({ error: "No user message provided" });
    return;
  }

  const systemPrompt = location
    ? SYSTEM_PROMPT + "\n\nThe visitor's current location (from their browser): " + location + "."
    : SYSTEM_PROMPT + "\n\nThe visitor has not shared their location with the browser yet.";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      res.status(502).json({ error: "Failed to reach the concierge" });
      return;
    }

    const data = await response.json();
    const modelReply = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();

    const reply = (modelReply || "I'm here") + " — " + pickClosingLine() + ".";
    const audio = await synthesizeSpeech(reply);

    res.status(200).json({ reply, audio });
  } catch (err) {
    console.error("voice-agent error:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
};
