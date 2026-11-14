"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_SECONDS } from "@/shared/contracts";
import {
  createBrowserRecorderDeps,
  createRecorderController,
  type RecorderController,
} from "./recorder-controller";
import type {
  CaptureRecorderError,
  CaptureRecorderProps,
  RecorderStatus,
} from "./types";

function formatElapsed(seconds: number): string {
  const whole = Math.min(MAX_AUDIO_SECONDS, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isRecorderError(value: unknown): value is CaptureRecorderError {
  return Boolean(
    value
    && typeof value === "object"
    && "code" in value
    && "message" in value
    && typeof (value as CaptureRecorderError).code === "string"
    && typeof (value as CaptureRecorderError).message === "string",
  );
}

/**
 * User-initiated browser mic recorder for Person C to place.
 * See `types.ts` for the props contract (`onCapture`, `transcribeAudio`, disabled/busy/error).
 */
export function CaptureRecorder({
  onCapture,
  transcribeAudio,
  disabled = false,
  busy = false,
  error = null,
  onRecorderError,
}: CaptureRecorderProps) {
  const controllerRef = useRef<RecorderController | null>(null);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const controller = createRecorderController(createBrowserRecorderDeps());
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;
    const id = window.setInterval(() => {
      setElapsed(controllerRef.current?.getElapsedSeconds() ?? 0);
    }, 200);
    return () => window.clearInterval(id);
  }, [status]);

  const controlsLocked = disabled || busy || status === "transcribing" || status === "stopping"
    || status === "requesting_permission";

  async function handleStart() {
    if (controlsLocked || status === "recording") return;
    setLocalError(null);
    setElapsed(0);
    setStatus("requesting_permission");
    try {
      await controllerRef.current?.start();
      setStatus("recording");
    } catch (err) {
      const mapped = isRecorderError(err)
        ? err
        : { code: "recorder_error" as const, message: "Could not start recording." };
      setStatus(mapped.code === "permission_denied" ? "permission_denied" : "error");
      setLocalError(mapped.message);
      onRecorderError?.(mapped);
    }
  }

  async function handleStop() {
    if (!controllerRef.current?.isRecording() || status === "stopping") return;
    setStatus("stopping");
    try {
      const audio = await controllerRef.current.stop();
      setElapsed(audio.durationSeconds);
      setStatus("transcribing");
      const capture = await transcribeAudio(audio);
      setStatus("idle");
      await onCapture(capture);
    } catch (err) {
      if (isRecorderError(err)) {
        setStatus(err.code === "silence" ? "silence" : "error");
        setLocalError(err.message);
        onRecorderError?.(err);
        return;
      }
      const message = err instanceof Error ? err.message : "Transcription failed.";
      const mapped: CaptureRecorderError = { code: "transcribe_failed", message };
      setStatus("error");
      setLocalError(message);
      onRecorderError?.(mapped);
    }
  }

  const feedback = error ?? localError;
  const recording = status === "recording";

  return (
    <section aria-label="Voice capture recorder">
      <div>
        <button
          type="button"
          onClick={recording ? handleStop : handleStart}
          disabled={controlsLocked && !recording}
          aria-pressed={recording}
        >
          {recording ? "Stop recording" : "Start recording"}
        </button>
        <p aria-live="polite">
          {recording || status === "stopping" || status === "transcribing"
            ? `Elapsed ${formatElapsed(elapsed)} / ${formatElapsed(MAX_AUDIO_SECONDS)}`
            : "Ready"}
        </p>
      </div>
      {busy ? <p role="status">Working on the last capture…</p> : null}
      {status === "permission_denied" ? (
        <p role="alert">Microphone permission denied.</p>
      ) : null}
      {status === "silence" ? (
        <p role="alert">No speech detected. Try again.</p>
      ) : null}
      {status === "transcribing" ? <p role="status">Transcribing…</p> : null}
      {feedback ? <p role="alert">{feedback}</p> : null}
    </section>
  );
}
