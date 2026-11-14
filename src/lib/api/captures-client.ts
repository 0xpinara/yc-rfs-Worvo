import type { ApiResult, Capture } from "@/shared/contracts";
import type { BandRecording } from "@/lib/vexo/band-session";
import type { RecorderAudioInput } from "@/components/capture/types";

async function parseResult(response: Response): Promise<Capture> {
  const body = await response.json() as ApiResult<{ capture: Capture }>;
  if (!body.ok) {
    throw new Error(body.error.message || `Capture failed (${response.status})`);
  }
  return body.data.capture;
}

/** Browser mic → POST /api/captures/transcribe */
export async function transcribeBrowserMic(input: RecorderAudioInput): Promise<Capture> {
  const form = new FormData();
  form.set("audio", input.blob, "capture.webm");
  form.set("durationSeconds", String(input.durationSeconds));
  form.set("sourceId", `browser-mic-${input.capturedAt}`);
  form.set("capturedAt", input.capturedAt);
  form.set("source", "browser_mic");
  form.set("mimeType", input.mimeType);

  const response = await fetch("/api/captures/transcribe", {
    method: "POST",
    body: form,
    headers: { "Idempotency-Key": `mic-${input.capturedAt}` },
  });
  return parseResult(response);
}

/** Band WAV (kit path) → POST /api/captures/transcribe with vexo_ble provenance fields */
export async function transcribeBandRecording(input: BandRecording): Promise<Capture> {
  const form = new FormData();
  form.set("audio", input.blob, "band-53.wav");
  form.set("durationSeconds", String(input.durationSeconds));
  form.set("sourceId", input.provenance.sessionId);
  form.set("sessionId", input.provenance.sessionId);
  form.set("capturedAt", input.capturedAt);
  form.set("source", "vexo_ble");
  form.set("mimeType", input.mimeType);

  const response = await fetch("/api/captures/transcribe", {
    method: "POST",
    body: form,
    headers: { "Idempotency-Key": `ble-${input.provenance.sessionId}-${input.capturedAt}` },
  });
  return parseResult(response);
}
