import { assertAudioBounds } from "./audio-bounds";

export type TranscriptionResult = {
  transcript: string;
  durationSeconds: number;
};

export type TranscriptionFailureReason =
  | "missing_credentials"
  | "empty_audio"
  | "too_large"
  | "too_long"
  | "empty_transcript"
  | "provider_error";

export type TranscriptionOutcome =
  | { ok: true; data: TranscriptionResult }
  | { ok: false; reason: TranscriptionFailureReason; message: string };

export type DeepgramTranscribeInput = {
  audio: Uint8Array | Buffer;
  mimeType: string;
  /** Client-reported duration; still bounded against MAX_AUDIO_SECONDS. */
  durationSeconds: number;
};

export type DeepgramTranscribeOptions = {
  apiKey?: string | null;
  model?: string | null;
  /** Defaults to true — keep the kit's Model Improvement Program opt-out. */
  mipOptOut?: boolean;
  fetchFn?: typeof fetch;
  listenUrl?: string;
};

type DeepgramListenResponse = {
  metadata?: { duration?: number };
  results?: {
    channels?: Array<{
      alternatives?: Array<{ transcript?: string }>;
    }>;
  };
};

function readApiKey(explicit?: string | null): string | null {
  if (explicit !== undefined) {
    const trimmed = explicit?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  }
  const fromEnv = process.env.DEEPGRAM_API_KEY?.trim() ?? "";
  return fromEnv.length > 0 ? fromEnv : null;
}

function readModel(explicit?: string | null): string {
  const fromOpt = explicit?.trim();
  if (fromOpt) return fromOpt;
  const fromEnv = process.env.SPEECH_MODEL?.trim();
  if (fromEnv) return fromEnv;
  return "nova-3";
}

/**
 * Server-only Deepgram pre-recorded transcription.
 * Skips clearly when `DEEPGRAM_API_KEY` (or explicit apiKey) is absent — no fabricated transcripts.
 * Always sends `mip_opt_out=true` unless explicitly disabled.
 */
export async function transcribeWithDeepgram(
  input: DeepgramTranscribeInput,
  options: DeepgramTranscribeOptions = {},
): Promise<TranscriptionOutcome> {
  const bounds = assertAudioBounds({
    byteLength: input.audio.byteLength,
    durationSeconds: input.durationSeconds,
  });
  if (!bounds.ok) {
    return { ok: false, reason: bounds.reason, message: bounds.message };
  }

  const apiKey = readApiKey(options.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      reason: "missing_credentials",
      message: "Deepgram skipped: DEEPGRAM_API_KEY is not configured.",
    };
  }

  const model = readModel(options.model);
  const mipOptOut = options.mipOptOut !== false;
  const base = options.listenUrl ?? "https://api.deepgram.com/v1/listen";
  const url = new URL(base);
  url.searchParams.set("model", model);
  url.searchParams.set("smart_format", "true");
  if (mipOptOut) url.searchParams.set("mip_opt_out", "true");

  const fetchFn = options.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": input.mimeType || "application/octet-stream",
      },
      body: input.audio as BodyInit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deepgram request failed.";
    return { ok: false, reason: "provider_error", message };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "provider_error",
      message: `Deepgram returned HTTP ${response.status}.`,
    };
  }

  let payload: DeepgramListenResponse;
  try {
    payload = await response.json() as DeepgramListenResponse;
  } catch {
    return { ok: false, reason: "provider_error", message: "Deepgram returned invalid JSON." };
  }

  const transcript = payload.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
  if (!transcript) {
    return {
      ok: false,
      reason: "empty_transcript",
      message: "Deepgram returned an empty transcript.",
    };
  }

  const providerDuration = payload.metadata?.duration;
  const durationSeconds = typeof providerDuration === "number" && Number.isFinite(providerDuration)
    ? providerDuration
    : input.durationSeconds;

  return { ok: true, data: { transcript, durationSeconds } };
}
