import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from "@/shared/contracts";
import type { CaptureRecorderError, RecorderAudioInput } from "./types";

/** Minimal MediaRecorder surface so node tests can inject fakes. */
export type MediaRecorderLike = {
  state: "inactive" | "recording" | "paused";
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onerror: ((event: { error?: { name?: string; message?: string } }) => void) | null;
  onstop: (() => void) | null;
  start: (timeslice?: number) => void;
  stop: () => void;
};

export type MediaStreamTrackLike = {
  stop: () => void;
};

export type MediaStreamLike = {
  getTracks: () => MediaStreamTrackLike[];
};

export type RecorderControllerDeps = {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStreamLike>;
  createRecorder: (stream: MediaStreamLike) => MediaRecorderLike;
  now?: () => number;
  maxSeconds?: number;
  maxBytes?: number;
  /** Treat near-empty blobs / very short takes as silence. */
  minDurationSeconds?: number;
  minByteLength?: number;
};

export type RecorderController = {
  start: () => Promise<void>;
  stop: () => Promise<RecorderAudioInput>;
  dispose: () => void;
  getElapsedSeconds: () => number;
  isRecording: () => boolean;
};

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "";
}

export function createBrowserRecorderDeps(): RecorderControllerDeps {
  return {
    getUserMedia: async (constraints) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("Microphone capture is not supported in this browser."), {
          name: "NotSupportedError",
        });
      }
      return navigator.mediaDevices.getUserMedia(constraints);
    },
    createRecorder: (stream) => {
      const mimeType = pickMimeType();
      const options = mimeType ? { mimeType } : undefined;
      return new MediaRecorder(stream as MediaStream, options) as unknown as MediaRecorderLike;
    },
  };
}

export function mapMediaError(error: unknown): CaptureRecorderError {
  const name = error && typeof error === "object" && "name" in error
    ? String((error as { name: string }).name)
    : "";
  const message = error instanceof Error ? error.message : "Microphone capture failed.";

  if (name === "NotAllowedError" || name === "PermissionDeniedError" || /permission|denied/i.test(message)) {
    return {
      code: "permission_denied",
      message: "Microphone permission was denied. Allow access to record an invoice note.",
    };
  }
  if (name === "NotSupportedError" || name === "NotFoundError" || name === "SecurityError") {
    return {
      code: "not_supported",
      message: message || "Microphone capture is not available on this device.",
    };
  }
  return { code: "recorder_error", message };
}

export function createRecorderController(deps: RecorderControllerDeps): RecorderController {
  const maxSeconds = deps.maxSeconds ?? MAX_AUDIO_SECONDS;
  const maxBytes = deps.maxBytes ?? MAX_AUDIO_BYTES;
  const minDurationSeconds = deps.minDurationSeconds ?? 0.4;
  const minByteLength = deps.minByteLength ?? 256;
  const now = deps.now ?? (() => Date.now());

  let stream: MediaStreamLike | null = null;
  let recorder: MediaRecorderLike | null = null;
  let chunks: Blob[] = [];
  let startedAtMs = 0;
  let recording = false;
  let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingReject: ((error: CaptureRecorderError) => void) | null = null;

  function clearAutoStop() {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
  }

  function stopTracks() {
    if (!stream) return;
    for (const track of stream.getTracks()) {
      track.stop();
    }
    stream = null;
  }

  function dispose() {
    clearAutoStop();
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.ondataavailable = null;
        recorder.stop();
      } catch {
        // ignore stop races during unmount
      }
    }
    recorder = null;
    chunks = [];
    recording = false;
    pendingReject = null;
    stopTracks();
  }

  async function start(): Promise<void> {
    if (recording) {
      throw { code: "recorder_error", message: "Recording is already in progress." } satisfies CaptureRecorderError;
    }

    dispose();
    chunks = [];

    try {
      stream = await deps.getUserMedia({ audio: true, video: false });
      recorder = deps.createRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };

      recorder.onerror = (event) => {
        const err = mapMediaError(event.error ?? new Error("MediaRecorder failed."));
        const reject = pendingReject;
        pendingReject = null;
        dispose();
        reject?.(err);
      };

      startedAtMs = now();
      recording = true;
      recorder.start(250);
      autoStopTimer = setTimeout(() => {
        if (recording && recorder?.state === "recording") {
          try {
            recorder.stop();
          } catch {
            // stop may race with user stop
          }
        }
      }, maxSeconds * 1000);
    } catch (error) {
      dispose();
      throw mapMediaError(error);
    }
  }

  function stop(): Promise<RecorderAudioInput> {
    if (!recording || !recorder) {
      return Promise.reject({
        code: "recorder_error",
        message: "No active recording to stop.",
      } satisfies CaptureRecorderError);
    }

    clearAutoStop();
    const capturedAt = new Date(startedAtMs).toISOString();
    const active = recorder;

    return new Promise<RecorderAudioInput>((resolve, reject) => {
      pendingReject = (err) => reject(err);

      active.onstop = () => {
        pendingReject = null;
        recording = false;
        const durationSeconds = Math.max(0, (now() - startedAtMs) / 1000);
        const mimeType = active.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        const byteLength = blob.size;
        stopTracks();
        recorder = null;
        chunks = [];

        if (durationSeconds < minDurationSeconds || byteLength < minByteLength) {
          reject({
            code: "silence",
            message: "No speech detected. Hold the button and speak, then stop.",
          } satisfies CaptureRecorderError);
          return;
        }
        if (durationSeconds > maxSeconds + 0.5) {
          reject({
            code: "too_long",
            message: `Recording exceeds the ${maxSeconds}s limit.`,
          } satisfies CaptureRecorderError);
          return;
        }
        if (byteLength > maxBytes) {
          reject({
            code: "too_large",
            message: `Recording exceeds the ${maxBytes} byte upload limit.`,
          } satisfies CaptureRecorderError);
          return;
        }

        resolve({
          blob,
          mimeType,
          durationSeconds: Math.min(durationSeconds, maxSeconds),
          byteLength,
          capturedAt,
          source: "browser_mic",
        });
      };

      try {
        if (active.state === "recording" || active.state === "paused") {
          active.stop();
        } else {
          // already inactive — synthesize onstop
          active.onstop?.();
        }
      } catch (error) {
        pendingReject = null;
        dispose();
        reject(mapMediaError(error));
      }
    });
  }

  return {
    start,
    stop,
    dispose,
    getElapsedSeconds: () => (recording ? Math.max(0, (now() - startedAtMs) / 1000) : 0),
    isRecording: () => recording,
  };
}
