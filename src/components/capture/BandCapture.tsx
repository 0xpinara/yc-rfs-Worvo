"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Capture } from "@/shared/contracts";
import { MAX_AUDIO_SECONDS } from "@/shared/contracts";
import { EXPECTED_BAND_NAME, EXPECTED_BAND_NUMBER, webBluetoothAvailability } from "@/lib/vexo/band-identity";
import { BandSession, type BandRecording, type BandSessionProvenance } from "@/lib/vexo/band-session";
import { kitAttribution } from "@/lib/vexo/kit";
import type { CaptureRecorderError } from "./types";

export type BandCaptureProps = {
  onCapture: (capture: Capture) => void | Promise<void>;
  /** Upload band WAV via authenticated transcribe route (source=vexo_ble). */
  transcribeAudio: (input: BandRecording) => Promise<Capture>;
  disabled?: boolean;
  busy?: boolean;
  error?: string | null;
  onRecorderError?: (error: CaptureRecorderError) => void;
  onConnected?: (provenance: BandSessionProvenance) => void;
  onDisconnected?: () => void;
  /** Live BandSession for LED / double-tap send after draft. */
  onSession?: (session: BandSession | null) => void;
  /** Shown under the controls when a draft is armed for double-tap send. */
  armHint?: string | null;
  /** Dev/test only: kit pretend band. */
  allowSim?: boolean;
};

function formatElapsed(seconds: number): string {
  const whole = Math.min(MAX_AUDIO_SECONDS, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Seamless band-53 capture using the official Vexo open kit (MIT).
 * Connect → record (blue mic LED) → stop → server Deepgram → onCapture.
 */
export function BandCapture({
  onCapture,
  transcribeAudio,
  disabled = false,
  busy = false,
  error = null,
  onRecorderError,
  onConnected,
  onDisconnected,
  onSession,
  armHint = null,
  allowSim = false,
}: BandCaptureProps) {
  const sessionRef = useRef<BandSession | null>(null);
  const [availabilityMessage] = useState<string | null>(() => {
    if (allowSim) return null;
    const avail = webBluetoothAvailability();
    return avail.ok ? null : avail.message;
  });
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "recording" | "stopping" | "transcribing" | "error"
  >("idle");
  const [provenance, setProvenance] = useState<BandSessionProvenance | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [useSim, setUseSim] = useState(false);

  useEffect(() => {
    const session = new BandSession();
    sessionRef.current = session;
    onSession?.(session);
    return () => {
      onSession?.(null);
      void session.disconnect();
      sessionRef.current = null;
    };
  }, [onSession]);

  useEffect(() => {
    if (status !== "recording") return;
    const started = performance.now();
    const id = window.setInterval(() => {
      setElapsed((performance.now() - started) / 1000);
    }, 200);
    return () => window.clearInterval(id);
  }, [status]);

  const locked = disabled || busy || status === "connecting" || status === "stopping"
    || status === "transcribing";

  const connect = useCallback(async () => {
    if (locked || status === "connected" || status === "recording") return;
    setLocalError(null);
    setStatus("connecting");
    try {
      const prov = await sessionRef.current!.connect({ sim: useSim && allowSim });
      setProvenance(prov);
      setStatus("connected");
      onConnected?.(prov);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Band connection failed.";
      setStatus("error");
      setLocalError(message);
      onRecorderError?.({ code: "recorder_error", message });
    }
  }, [allowSim, locked, onConnected, onRecorderError, status, useSim]);

  const disconnect = useCallback(async () => {
    await sessionRef.current?.disconnect();
    setProvenance(null);
    setStatus("idle");
    setElapsed(0);
    onDisconnected?.();
  }, [onDisconnected]);

  const start = useCallback(async () => {
    if (locked || status !== "connected") return;
    setLocalError(null);
    setElapsed(0);
    try {
      await sessionRef.current!.startRecording();
      setStatus("recording");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start band microphone.";
      setStatus("error");
      setLocalError(message);
      onRecorderError?.({ code: "recorder_error", message });
    }
  }, [locked, onRecorderError, status]);

  const stop = useCallback(async () => {
    if (status !== "recording") return;
    setStatus("stopping");
    try {
      const recording = await sessionRef.current!.stopRecording();
      setElapsed(recording.durationSeconds);
      setStatus("transcribing");
      const capture = await transcribeAudio(recording);
      setStatus("connected");
      await onCapture(capture);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const message = err instanceof Error ? err.message : "Band capture failed.";
      if (code === "silence") {
        setStatus("connected");
        setLocalError(message);
        onRecorderError?.({ code: "silence", message });
        return;
      }
      setStatus("error");
      setLocalError(message);
      onRecorderError?.({
        code: code === "too_long" ? "too_long" : code === "too_large" ? "too_large" : "transcribe_failed",
        message,
      });
    }
  }, [onCapture, onRecorderError, status, transcribeAudio]);

  const feedback = error ?? localError;
  const recording = status === "recording";

  return (
    <section aria-label={`Band ${EXPECTED_BAND_NUMBER} capture`}>
      <h2>Band {EXPECTED_BAND_NUMBER}</h2>
      <p>
        Official kit path for <strong>{EXPECTED_BAND_NAME}</strong>. Close the kit dashboard before connecting.
        Solid <strong>blue</strong> = mic on. Blinking <strong>amber</strong> = draft ready — <strong>double-tap</strong> to send.
        Solid <strong>green</strong> = paid.
      </p>
      <p><small>{kitAttribution()}</small></p>
      {availabilityMessage && !useSim ? <p role="status">{availabilityMessage}</p> : null}
      {allowSim ? (
        <label>
          <input
            type="checkbox"
            checked={useSim}
            disabled={status === "connected" || recording}
            onChange={(e) => setUseSim(e.target.checked)}
          />
          {" "}Use pretend band (sim)
        </label>
      ) : null}
      {provenance ? (
        <p>
          Connected: {provenance.bandName} (#{provenance.bandNumber}, verified)
          {" · "}{provenance.transport}
          {provenance.firmware ? ` · fw ${provenance.firmware}` : ""}
        </p>
      ) : null}
      <div>
        {status === "idle" || status === "error" || status === "connecting" ? (
          <button type="button" onClick={() => void connect()} disabled={locked || Boolean(availabilityMessage && !useSim)}>
            {status === "connecting" ? "Connecting…" : "Connect band"}
          </button>
        ) : (
          <button type="button" onClick={() => void disconnect()} disabled={recording || status === "stopping"}>
            Disconnect
          </button>
        )}
        <button
          type="button"
          onClick={() => void (recording ? stop() : start())}
          disabled={
            locked && !recording
              ? true
              : status !== "connected" && status !== "recording"
          }
          aria-pressed={recording}
        >
          {recording ? "Stop band mic" : "Start band mic"}
        </button>
        <p aria-live="polite">
          {recording || status === "stopping" || status === "transcribing"
            ? `Elapsed ${formatElapsed(elapsed)} / ${formatElapsed(MAX_AUDIO_SECONDS)}`
            : status === "connected"
              ? "Ready to record"
              : "Connect to record"}
        </p>
      </div>
      {busy ? <p role="status">Working on the last capture…</p> : null}
      {status === "transcribing" ? <p role="status">Transcribing band audio…</p> : null}
      {armHint ? <p role="status">{armHint}</p> : null}
      {feedback ? <p role="alert">{feedback}</p> : null}
    </section>
  );
}
