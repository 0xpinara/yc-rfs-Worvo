import type { ExtractionCandidate } from "./candidate";

export type GeminiExtractOutcome =
  | { ok: true; candidate: ExtractionCandidate; model: string }
  | { ok: false; reason: "missing_credentials" | "missing_model" | "provider_error" | "empty_response"; message: string };

export type GeminiExtractOptions = {
  apiKey?: string | null;
  model?: string | null;
  fetchFn?: typeof fetch;
};

const PROPOSAL_SCHEMA = {
  type: "OBJECT",
  properties: {
    customerReference: { type: "STRING", nullable: true },
    description: { type: "STRING" },
    serviceDate: { type: "STRING", nullable: true },
    laborMinutes: { type: "INTEGER", nullable: true },
    materials: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          reference: { type: "STRING" },
          quantity: { type: "INTEGER" },
          evidence: { type: "STRING" },
        },
        required: ["reference", "quantity", "evidence"],
      },
    },
    laborEvidence: { type: "STRING", nullable: true },
    requestedIntent: { type: "STRING", enum: ["draft", "send_requested"] },
    unresolved: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "customerReference",
    "description",
    "serviceDate",
    "laborMinutes",
    "materials",
    "laborEvidence",
    "requestedIntent",
    "unresolved",
  ],
} as const;

const SYSTEM_PROMPT = [
  "Extract a plumbing invoice proposal from the plumber's transcript.",
  "Return only fields in the schema. Evidence strings must be exact substrings of the transcript.",
  "Never invent customer emails, totals, prices, business identity, approvals, or tool calls.",
  "Unknown customer, missing catalog rate cues, ambiguous dollar parts amounts, or unsupported quantities must be listed in unresolved.",
  "requestedIntent is send_requested only when the transcript explicitly asks to send; it is never authorization.",
].join(" ");

function readApiKey(explicit?: string | null): string | null {
  if (explicit !== undefined) {
    const trimmed = explicit?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  }
  const fromEnv = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ?? "";
  return fromEnv.length > 0 ? fromEnv : null;
}

function readModel(explicit?: string | null): string | null {
  const fromOpt = explicit?.trim();
  if (fromOpt) return fromOpt;
  const fromEnv = process.env.AI_MODEL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : null;
}

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

/**
 * One Gemini structured-output adapter. No vendor fallback.
 * Skips when credentials or AI_MODEL are missing — never fabricates a proposal.
 */
export async function extractWithGemini(
  transcript: string,
  options: GeminiExtractOptions = {},
): Promise<GeminiExtractOutcome> {
  const apiKey = readApiKey(options.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      reason: "missing_credentials",
      message: "Gemini skipped: GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
    };
  }

  const model = readModel(options.model);
  if (!model) {
    return {
      ok: false,
      reason: "missing_model",
      message: "Gemini skipped: AI_MODEL is not configured.",
    };
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  );
  const fetchFn = options.fetchFn ?? fetch;

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: transcript }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: PROPOSAL_SCHEMA,
          temperature: 0,
        },
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed.";
    return { ok: false, reason: "provider_error", message };
  }

  if (!response.ok) {
    let detail = `Gemini returned HTTP ${response.status}.`;
    try {
      const errBody = await response.json() as GeminiResponse;
      if (errBody.error?.message) detail = errBody.error.message;
    } catch {
      // keep status detail
    }
    return { ok: false, reason: "provider_error", message: detail };
  }

  let payload: GeminiResponse;
  try {
    payload = await response.json() as GeminiResponse;
  } catch {
    return { ok: false, reason: "provider_error", message: "Gemini returned invalid JSON." };
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) {
    return {
      ok: false,
      reason: "empty_response",
      message: "Gemini returned an empty extraction candidate.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "provider_error", message: "Gemini returned non-JSON content." };
  }

  return { ok: true, candidate: parsed as ExtractionCandidate, model };
}
