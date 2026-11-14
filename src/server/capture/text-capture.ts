import type { ApiResult, Capture } from "../../shared/contracts";
import { requireBusinessContext } from "./context";
import { saveCapture } from "./store";

export type TextCaptureBody = {
  transcript: string;
  sourceId: string;
  source?: "typed_text" | "fixture" | "vexo_memory";
  sessionId?: string | null;
  capturedAt?: string;
  /** Browser may assert vexo_ble; remains unverified unless the bridge proves it. */
  claimedSource?: string;
};

/**
 * Typed / bridge transcript → attributable Capture via B's context + saveCapture.
 * Rejects client businessId/actorId authority fields.
 */
export async function handleTextCapture(
  body: TextCaptureBody,
  headers: { idempotencyKey?: string | null } = {},
): Promise<ApiResult<{ capture: Capture }>> {
  void headers.idempotencyKey;

  const auth = await requireBusinessContext();
  if (!auth.ok) {
    return { ok: false, error: { code: auth.error.code, message: auth.error.message } };
  }

  if (body && typeof body === "object") {
    const record = body as TextCaptureBody & Record<string, unknown>;
    if ("businessId" in record || "actorId" in record) {
      return {
        ok: false,
        error: {
          code: "invalid_input",
          message: "Client may not supply businessId or actorId.",
          fields: ["businessId", "actorId"],
        },
      };
    }
  }

  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim() : "";
  if (!transcript || !sourceId) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "transcript and sourceId are required.",
        fields: ["transcript", "sourceId"],
      },
    };
  }

  let source: "typed_text" | "fixture" | "vexo_memory" = "typed_text";
  if (body.source === "fixture" || body.source === "vexo_memory" || body.source === "typed_text") {
    source = body.source;
  }

  // claimedSource of vexo_ble without bridge proof stays typed_text / unverified note in SOURCES.
  const capturedAt = body.capturedAt && !Number.isNaN(Date.parse(body.capturedAt))
    ? new Date(body.capturedAt).toISOString()
    : new Date().toISOString();

  const saved = await saveCapture(auth.context, {
    source,
    sourceId,
    sessionId: body.sessionId ?? auth.context.sessionId,
    capturedAt,
    transcript,
    liveAudio: false,
  });

  if (!saved.ok) {
    return {
      ok: false,
      error: { code: "invalid_input", message: saved.message, fields: saved.fields },
    };
  }

  return { ok: true, data: { capture: saved.capture } };
}
