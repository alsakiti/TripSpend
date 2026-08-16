import worker from "./ai-worker.js";

const CLOUDFLARE_MODEL = "@cf/zai-org/glm-4.7-flash";
const GEMINI_MODEL = "gemini-3.5-flash";
const RUNTIME_VERSION = "7.0.2";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const TOOL_GROUPS = {
  expense: ["add_expense", "edit_expense", "delete_expense"],
  itinerary: ["add_itinerary", "edit_itinerary", "delete_itinerary"],
  plan: ["add_plan", "edit_plan", "delete_plan"],
  budget: ["set_trip_budget", "set_country_budget"],
  trip: ["edit_trip"],
  traveler: ["add_traveler", "edit_traveler", "delete_traveler"],
  country: ["add_country", "edit_country", "delete_country"],
  settlement: ["add_settlement", "edit_settlement", "delete_settlement"]
};

function userRequest(input) {
  const messages = Array.isArray(input?.messages) ? input.messages : [];
  const content = String(messages.at(-1)?.content || "");
  const match = content.match(/USER REQUEST:\s*([\s\S]*)$/i);
  return String(match?.[1] || content).trim().slice(0, 1800);
}

function hasWriteIntent(text) {
  return /\b(add|edit|change|set|delete|remove|rename|record|update|archive|paid|spent|purchase)\b|أضف|اضف|عدّل|عدل|غيّر|غير|احذف|حذف|سجّل|سجل|دفعت|صرفت|شراء/i.test(text);
}

function chooseTools(input) {
  const available = Array.isArray(input?.tools) ? input.tools : [];
  if (!available.length) return [];
  const q = userRequest(input);
  if (!hasWriteIntent(q)) return [];

  const wanted = new Set();
  const add = group => TOOL_GROUPS[group].forEach(name => wanted.add(name));

  if (/expense|spent|spend|purchase|paid|dinner|lunch|breakfast|food|coffee|taxi|shopping|grocer|مصروف|صرفت|دفعت|شراء|عشاء|غداء|إفطار|افطار|طعام|قهوة|تاكسي/i.test(q)) add("expense");
  if (/itinerary|booking|flight|hotel|activity|restaurant|transport|برنامج|حجز|طيران|فندق|نشاط|مطعم|تنقل/i.test(q)) add("itinerary");
  if (/plan|planned|upcoming cost|expected cost|خطة|مخطط|تكلفة قادمة|تكاليف قادمة/i.test(q)) add("plan");
  if (/budget|ميزانية/i.test(q)) add("budget");
  if (/trip name|trip date|rename trip|edit trip|اسم الرحلة|تاريخ الرحلة|تعديل الرحلة/i.test(q)) add("trip");
  if (/traveler|traveller|person|member|مسافر|مسافرون|شخص/i.test(q)) add("traveler");
  if (/country|destination|country stop|دولة|بلد|وجهة/i.test(q)) add("country");
  if (/settlement|owe|owed|repay|pay back|تسوية|يدين|دين/i.test(q)) add("settlement");

  if (!wanted.size) return [];
  return available.filter(tool => wanted.has(String(tool?.name || "")));
}

function geminiConversation(input) {
  const messages = Array.isArray(input?.messages) ? input.messages : [];
  const systemParts = [];
  const contents = [];

  for (const message of messages) {
    const text = String(message?.content || "").trim();
    if (!text) continue;
    if (message?.role === "system") {
      systemParts.push(text);
      continue;
    }
    contents.push({
      role: message?.role === "assistant" ? "model" : "user",
      parts: [{ text }]
    });
  }

  return {
    systemInstruction: {
      parts: [{
        text: `${systemParts.join("\n\n")}\n\nCONVERSATION MODE:\nYou are a natural, interactive assistant. Chat normally and answer follow-up questions instead of requiring command-like wording. You may discuss travel, destinations, budgeting, food, culture, trip planning and general everyday questions. When a question is about the user's current TripSpend trip, use the supplied trip data as the source of truth and never invent trip-specific facts. If a fact could require current live information and no live-search result is provided, be clear that it may need verification. Use a TripSpend function only when the user actually wants to change app data. Never claim a change was saved until the app confirms it.`
      }]
    },
    contents
  };
}

function geminiToolDeclarations(input) {
  const selected = chooseTools(input);
  if (!selected.length) return [];
  return [{
    functionDeclarations: selected.map(tool => ({
      name: String(tool?.name || ""),
      description: String(tool?.description || ""),
      parameters: tool?.parameters || { type: "object", properties: {} }
    }))
  }];
}

function geminiResult(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter(part => typeof part?.text === "string")
    .map(part => part.text)
    .join("\n")
    .trim();
  const toolCalls = parts
    .filter(part => part?.functionCall?.name)
    .map(part => ({
      name: part.functionCall.name,
      arguments: part.functionCall.args || {}
    }));
  return { response: text, tool_calls: toolCalls };
}

async function runGemini(apiKey, input) {
  const conversation = geminiConversation(input);
  const tools = geminiToolDeclarations(input);
  const body = {
    ...conversation,
    generationConfig: {
      maxOutputTokens: Math.min(2400, Math.max(400, Number(input?.max_completion_tokens || 1200))),
      temperature: 0.7
    }
  };
  if (tools.length) body.tools = tools;

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed (${response.status})`;
    throw new Error(message);
  }
  return geminiResult(data);
}

function normalizeToolCall(call) {
  if (call?.function && typeof call.function === "object") {
    return { name: call.function.name, arguments: call.function.arguments };
  }
  return call;
}

function normalizeCloudflareResult(result) {
  if (!result || typeof result !== "object") return result;
  const message = result?.choices?.[0]?.message;
  if (!message) return result;
  const calls = Array.isArray(message.tool_calls) ? message.tool_calls.map(normalizeToolCall) : [];
  return {
    ...result,
    response: String(result.response ?? message.content ?? ""),
    tool_calls: Array.isArray(result.tool_calls) ? result.tool_calls : calls
  };
}

function cloudflareFallback(originalAI) {
  return {
    async run(model, input, options) {
      if (model !== CLOUDFLARE_MODEL) return originalAI.run(model, input, options);
      const selected = chooseTools(input);
      const normalized = {
        messages: Array.isArray(input?.messages) ? input.messages : []
      };
      if (selected.length) normalized.tools = selected;
      if (Number.isFinite(input?.max_completion_tokens)) normalized.max_completion_tokens = input.max_completion_tokens;

      try {
        return normalizeCloudflareResult(await originalAI.run(model, normalized, options));
      } catch (error) {
        const text = String(error?.message || error || "");
        if (!/8001|invalid input|badinput/i.test(text)) throw error;
        return normalizeCloudflareResult(await originalAI.run(model, { messages: normalized.messages }, options));
      }
    }
  };
}

function hybridAi(env) {
  const fallback = cloudflareFallback(env.AI);
  return {
    async run(model, input, options) {
      if (model !== CLOUDFLARE_MODEL) return fallback.run(model, input, options);
      const key = String(env?.GEMINI_API_KEY || "").trim();
      if (key) {
        try {
          return await runGemini(key, input);
        } catch (error) {
          console.warn("Gemini unavailable; using Cloudflare AI fallback:", error?.message || error);
        }
      }
      return fallback.run(model, input, options);
    }
  };
}

async function stampRuntime(response, env) {
  const type = response?.headers?.get("content-type") || "";
  if (!type.includes("application/json")) return response;
  const data = await response.clone().json().catch(() => null);
  if (!data || typeof data !== "object") return response;

  const geminiReady = !!String(env?.GEMINI_API_KEY || "").trim();
  data.version = RUNTIME_VERSION;
  data.provider = geminiReady ? "gemini" : "cloudflare";
  data.model = geminiReady ? GEMINI_MODEL : CLOUDFLARE_MODEL;
  data.fallbackProvider = "cloudflare";
  data.interactiveChat = true;
  data.geminiConfigured = geminiReady;
  if (Array.isArray(data.capabilities)) {
    for (const capability of ["general-chat", "multi-turn-chat", "interactive-assistant", "gemini-primary", "cloudflare-fallback"]) {
      if (!data.capabilities.includes(capability)) data.capabilities.push(capability);
    }
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(JSON.stringify(data), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const safeEnv = { ...env, AI: hybridAi(env) };
    const response = await worker.fetch(request, safeEnv, ctx);
    return stampRuntime(response, env);
  }
};
