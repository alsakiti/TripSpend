import worker from "./ai-worker.js";

const CHAT_MODEL = "@cf/zai-org/glm-4.7-flash";
const RUNTIME_VERSION = "7.0.1";

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

function normalizeChatInput(input) {
  const tools = chooseTools(input);
  const normalized = {
    messages: Array.isArray(input?.messages) ? input.messages : []
  };
  if (tools.length) normalized.tools = tools;
  if (Number.isFinite(input?.max_completion_tokens)) normalized.max_completion_tokens = input.max_completion_tokens;
  return normalized;
}

function isInvalidInput(error) {
  const text = String(error?.message || error || "");
  return /8001|invalid input|badinput/i.test(text);
}

function normalizeToolCall(call) {
  if (call?.function && typeof call.function === "object") {
    return {
      name: call.function.name,
      arguments: call.function.arguments
    };
  }
  return call;
}

function normalizeChatResult(result) {
  if (!result || typeof result !== "object") return result;
  const message = result?.choices?.[0]?.message;
  if (!message) return result;

  const calls = Array.isArray(message.tool_calls)
    ? message.tool_calls.map(normalizeToolCall)
    : [];

  return {
    ...result,
    response: String(result.response ?? message.content ?? ""),
    tool_calls: Array.isArray(result.tool_calls) ? result.tool_calls : calls
  };
}

function compatibleAi(originalAI) {
  return {
    async run(model, input, options) {
      if (model !== CHAT_MODEL) return originalAI.run(model, input, options);

      const normalized = normalizeChatInput(input);
      try {
        return normalizeChatResult(await originalAI.run(model, normalized, options));
      } catch (error) {
        if (!isInvalidInput(error)) throw error;
        console.warn("TripSpend AI compatibility retry after invalid input:", error?.message || error);
      }

      const minimal = { messages: normalized.messages };
      if (normalized.tools?.length) {
        try {
          return normalizeChatResult(await originalAI.run(model, { ...minimal, tools: normalized.tools }, options));
        } catch (error) {
          if (!isInvalidInput(error)) throw error;
          console.warn("TripSpend AI tool retry failed; falling back to chat-only:", error?.message || error);
        }
      }

      return normalizeChatResult(await originalAI.run(model, minimal, options));
    }
  };
}

async function stampRuntimeVersion(response) {
  const type = response?.headers?.get("content-type") || "";
  if (!type.includes("application/json")) return response;

  const data = await response.clone().json().catch(() => null);
  if (!data || typeof data !== "object") return response;

  data.version = RUNTIME_VERSION;
  if (Array.isArray(data.capabilities) && !data.capabilities.includes("input-compat-v701")) {
    data.capabilities.push("input-compat-v701");
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
    const safeEnv = { ...env, AI: compatibleAi(env.AI) };
    const response = await worker.fetch(request, safeEnv, ctx);
    return stampRuntimeVersion(response);
  }
};
