const SYSTEM_PROMPT = `You are TripSpend AI, a concise read-only travel spending assistant inside the TripSpend app.

Use the supplied current-trip context to answer questions about budgets, expenses, countries, travelers, settlements, itinerary and planned costs. Do not claim you changed, added, deleted or edited anything. If the data does not contain the answer, say that clearly. Never invent booking references, spending values, dates or itinerary details. For affordability questions, explain the arithmetic briefly and distinguish trip budget from the Safe Today amount when both are available. Keep responses practical and usually under 180 words. Receipt images, backups and past trips are intentionally not provided.`;

function cors(origin, allowedOrigin) {
  const allowed = allowedOrigin || "https://alsakiti.github.io";
  const safeOrigin = origin === allowed ? origin : allowed;
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin, env.ALLOWED_ORIGIN) }
  });
}

function compactHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-8).map(item => ({
    role: item?.role === "assistant" ? "assistant" : "user",
    content: String(item?.content || "").slice(0, 1600)
  }));
}

function promptFor(body) {
  const history = compactHistory(body.history);
  const transcript = history.length
    ? `\nRecent conversation:\n${history.map(item => `${item.role.toUpperCase()}: ${item.content}`).join("\n")}`
    : "";
  return `Current TripSpend data (JSON):\n${JSON.stringify(body.context || {})}${transcript}\n\nUSER QUESTION: ${String(body.question || "").slice(0, 1000)}`;
}

async function callOpenAI(env, prompt) {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI is not configured on this server.");
  const model = env.OPENAI_MODEL || "gpt-5.6";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: SYSTEM_PROMPT,
      input: prompt,
      store: false,
      max_output_tokens: 800
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI returned ${response.status}`);
  const answer = data.output_text || data.output
    ?.flatMap(item => Array.isArray(item.content) ? item.content : [])
    ?.filter(item => item.type === "output_text")
    ?.map(item => item.text)
    ?.join("\n");
  if (!answer) throw new Error("OpenAI returned no text.");
  return { answer, model };
}

async function callAnthropic(env, prompt) {
  if (!env.ANTHROPIC_API_KEY) throw new Error("Claude is not configured on this server.");
  if (!env.ANTHROPIC_MODEL) throw new Error("Set ANTHROPIC_MODEL in the Worker environment.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Anthropic returned ${response.status}`);
  const answer = Array.isArray(data.content)
    ? data.content.filter(item => item.type === "text").map(item => item.text).join("\n")
    : "";
  if (!answer) throw new Error("Claude returned no text.");
  return { answer, model: env.ANTHROPIC_MODEL };
}

async function callGemini(env, prompt) {
  if (!env.GEMINI_API_KEY) throw new Error("Gemini is not configured on this server.");
  const model = env.GEMINI_MODEL || "gemini-3.6-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": env.GEMINI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 800 }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini returned ${response.status}`);
  const answer = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n").trim();
  if (!answer) throw new Error("Gemini returned no text.");
  return { answer, model };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://alsakiti.github.io";

    if (request.method === "OPTIONS") {
      if (origin && origin !== allowedOrigin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors(origin, allowedOrigin) });
    }

    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin, env);
    if (origin && origin !== allowedOrigin) return json({ error: "Origin not allowed" }, 403, origin, env);

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 220000) return json({ error: "Request too large" }, 413, origin, env);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin, env);
    }

    const provider = String(body.provider || "openai").toLowerCase();
    const question = String(body.question || "").trim();
    if (!question) return json({ error: "Question is required" }, 400, origin, env);

    const prompt = promptFor(body);
    if (prompt.length > 190000) return json({ error: "Trip context is too large. Reduce imported data and try again." }, 413, origin, env);

    try {
      let result;
      if (provider === "openai") result = await callOpenAI(env, prompt);
      else if (provider === "anthropic") result = await callAnthropic(env, prompt);
      else if (provider === "gemini") result = await callGemini(env, prompt);
      else return json({ error: "Unsupported AI provider" }, 400, origin, env);

      return json({ answer: result.answer, provider, model: result.model }, 200, origin, env);
    } catch (error) {
      console.error("TripSpend AI error", provider, error);
      return json({ error: error?.message || "AI request failed" }, 502, origin, env);
    }
  }
};
