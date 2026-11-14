import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from "@/shared/contracts";

export type AudioBoundsFailure =
  | { ok: false; reason: "empty_audio" | "too_large" | "too_long"; message: string }
  | { ok: true };

export function assertAudioBounds(input: {
  byteLength: number;
  durationSeconds: number;
  maxBytes?: number;
  maxSeconds?: number;
}): AudioBoundsFailure {
  const maxBytes = input.maxBytes ?? MAX_AUDIO_BYTES;
  const maxSeconds = input.maxSeconds ?? MAX_AUDIO_SECONDS;

  if (input.byteLength <= 0) {
    return { ok: false, reason: "empty_audio", message: "Audio payload is empty." };
  }
  if (input.byteLength > maxBytes) {
    return {
      ok: false,
      reason: "too_large",
      message: `Audio exceeds the ${maxBytes} byte limit.`,
    };
  }
  if (input.durationSeconds > maxSeconds) {
    return {
      ok: false,
      reason: "too_long",
      message: `Audio exceeds the ${maxSeconds}s limit.`,
    };
  }
  return { ok: true };
}
