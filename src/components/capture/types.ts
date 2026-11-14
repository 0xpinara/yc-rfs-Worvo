import type { Capture } from "@/shared/contracts";

/**
 * Person C — recorder props contract (A2)
 *
 * C owns placement of `CaptureRecorder`. A owns mic permission, start/stop,
 * elapsed time, silence/permission/error states, and unmount cleanup.
 *
 * Wire:
 * - `transcribeAudio` → authenticated `POST /api/captures/transcribe` (when B/A routes exist)
 * - `onCapture(capture)` → store `capture.id`, then call B's draft endpoint
 * - `disabled` / `busy` / `error` → parent-driven feedback (auth missing, draft in flight, API errors)
 *
 * Do not invent Capture fields client-side. Do not put secrets, API keys, or
 * transcripts in localStorage. API keys stay server-only.
 */
export type CaptureRecorderErrorCode =
  | "permission_denied"
  | "not_supported"
  | "silence"
  | "too_long"
  | "too_large"
  | "recorder_error"
  | "transcribe_failed";

export type CaptureRecorderError = {
  code: CaptureRecorderErrorCode;
  message: string;
};

/** Bounded browser mic payload before server transcription/persistence. */
export type RecorderAudioInput = {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  byteLength: number;
  capturedAt: string;
  source: "browser_mic";
};

export type CaptureRecorderProps = {
  /** Called after a successful transcribe round-trip with a validated Capture DTO. */
  onCapture: (capture: Capture) => void | Promise<void>;
  /**
   * Uploads bounded audio and returns the server Capture.
   * Inject a stub in tests; C wires the real API client at integration time.
   */
  transcribeAudio: (input: RecorderAudioInput) => Promise<Capture>;
  /** Parent disables controls (e.g. signed out). */
  disabled?: boolean;
  /** Parent is processing (e.g. drafting invoice); shows busy feedback and blocks new starts. */
  busy?: boolean;
  /** Parent/server error string to surface (draft/API failures). */
  error?: string | null;
  /** Local recorder failures (permission, silence, oversized, etc.). */
  onRecorderError?: (error: CaptureRecorderError) => void;
};

export type RecorderStatus =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "stopping"
  | "transcribing"
  | "permission_denied"
  | "silence"
  | "error";
