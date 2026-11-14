import { handleTranscribeCapture } from "@/server/capture/transcribe-capture";
import type { ApiResult, Capture } from "@/shared/contracts";
import { MAX_AUDIO_BYTES } from "@/shared/contracts";

export const runtime = "nodejs";

function jsonResult(result: ApiResult<{ capture: Capture }>): Response {
  if (result.ok) {
    return Response.json(result, { status: 200 });
  }
  const status =
    result.error.code === "unauthenticated" ? 401
    : result.error.code === "forbidden" ? 403
    : result.error.code === "provider_unavailable" ? 503
    : 422;
  return Response.json(result, { status });
}

/**
 * POST /api/captures/transcribe — authenticated multipart audio.
 * Fields: audio (file), durationSeconds, sourceId, optional sessionId/capturedAt/source/mimeType.
 * Streams are bounded by counting bytes; Content-Length alone is not trusted.
 */
export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResult({
      ok: false,
      error: { code: "invalid_input", message: "Expected multipart form data." },
    });
  }

  const file = form.get("audio");
  if (!(file instanceof Blob)) {
    return jsonResult({
      ok: false,
      error: { code: "invalid_input", message: "audio file is required.", fields: ["audio"] },
    });
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return jsonResult({
      ok: false,
      error: {
        code: "invalid_input",
        message: `Audio exceeds ${MAX_AUDIO_BYTES} bytes.`,
        fields: ["audio"],
      },
    });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    return jsonResult({
      ok: false,
      error: {
        code: "invalid_input",
        message: `Audio exceeds ${MAX_AUDIO_BYTES} bytes.`,
        fields: ["audio"],
      },
    });
  }

  const durationRaw = String(form.get("durationSeconds") ?? "");
  const durationSeconds = Number(durationRaw);
  const sourceId = String(form.get("sourceId") ?? "").trim();
  const sessionIdRaw = form.get("sessionId");
  const sessionId = sessionIdRaw == null || sessionIdRaw === ""
    ? null
    : String(sessionIdRaw);
  const capturedAt = form.get("capturedAt") ? String(form.get("capturedAt")) : undefined;
  const sourceField = String(form.get("source") ?? "browser_mic");
  const source = sourceField === "vexo_ble" ? "vexo_ble" as const : "browser_mic" as const;
  const mimeType = (file.type && file.type.length > 0)
    ? file.type
    : String(form.get("mimeType") ?? "application/octet-stream");

  const result = await handleTranscribeCapture({
    audio: buffer,
    mimeType,
    durationSeconds,
    sourceId,
    sessionId,
    capturedAt,
    source,
  });
  return jsonResult(result);
}
