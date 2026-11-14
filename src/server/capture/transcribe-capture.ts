import type { ApiResult, Capture } from "../../shared/contracts";
import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from "../../shared/contracts";
import { requireBusinessContext } from "./context";
import { transcribeWithDeepgram } from "./deepgram";
import { saveCapture } from "./store";

export type TranscribeCaptureInput = {
  audio: Uint8Array;
  mimeType: string;
  durationSeconds: number;
  sourceId: string;
  sessionId?: string | null;
  capturedAt?: string;
  source?: "browser_mic" | "vexo_ble";
};

/**
 * Authenticated multipart audio → Deepgram → attributable Capture.
 * Enforces streamed byte limits and duration; does not trust filename alone.
 */
export async function handleTranscribeCapture(
  input: TranscribeCaptureInput,
): Promise<ApiResult<{ capture: Capture }>> {
  const auth = await requireBusinessContext();
  if (!auth.ok) {
    return { ok: false, error: { code: auth.error.code, message: auth.error.message } };
  }

  if (!input.sourceId?.trim()) {
    return {
      ok: false,
      error: { code: "invalid_input", message: "sourceId is required.", fields: ["sourceId"] },
    };
  }

  if (input.audio.byteLength === 0) {
    return {
      ok: false,
      error: { code: "invalid_input", message: "Audio payload is empty.", fields: ["audio"] },
    };
  }

  if (input.audio.byteLength > MAX_AUDIO_BYTES) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: `Audio exceeds ${MAX_AUDIO_BYTES} bytes.`,
        fields: ["audio"],
      },
    };
  }

  if (!(input.durationSeconds > 0) || input.durationSeconds > MAX_AUDIO_SECONDS) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: `durationSeconds must be in (0, ${MAX_AUDIO_SECONDS}].`,
        fields: ["durationSeconds"],
      },
    };
  }

  const mimeType = input.mimeType?.trim() || "application/octet-stream";
  // Opus from the band needs an appropriate container; do not relabel as WebM.
  if (/webm/i.test(mimeType) && input.source === "vexo_ble") {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Band Opus audio must use an Opus/Ogg container, not a WebM label.",
        fields: ["mimeType"],
      },
    };
  }

  const transcription = await transcribeWithDeepgram({
    audio: input.audio,
    mimeType,
    durationSeconds: input.durationSeconds,
  });

  if (!transcription.ok) {
    if (transcription.reason === "missing_credentials" || transcription.reason === "provider_error") {
      return {
        ok: false,
        error: { code: "provider_unavailable", message: transcription.message },
      };
    }
    return {
      ok: false,
      error: { code: "invalid_input", message: transcription.message, fields: ["audio"] },
    };
  }

  const source = input.source === "vexo_ble" ? "vexo_ble" : "browser_mic";
  const capturedAt = input.capturedAt && !Number.isNaN(Date.parse(input.capturedAt))
    ? new Date(input.capturedAt).toISOString()
    : new Date().toISOString();

  const saved = await saveCapture(auth.context, {
    source,
    sourceId: input.sourceId.trim(),
    sessionId: input.sessionId ?? auth.context.sessionId,
    capturedAt,
    transcript: transcription.data.transcript,
    liveAudio: source === "vexo_ble" || source === "browser_mic",
  });

  if (!saved.ok) {
    return {
      ok: false,
      error: { code: "invalid_input", message: saved.message, fields: saved.fields },
    };
  }

  return { ok: true, data: { capture: saved.capture } };
}
