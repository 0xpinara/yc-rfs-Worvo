"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Capture } from "@/shared/contracts";
import { MAX_AUDIO_SECONDS } from "@/shared/contracts";
import { useInvoiceFlow } from "@/components/invoices/useInvoiceFlow";
import { transcribeBandRecording, transcribeBrowserMic } from "@/lib/api/captures-client";
import { TALLY_POSES, type TallyPose } from "@/components/landing/tally-art";
import styles from "./App.module.css";
import { InvoiceCard } from "./InvoiceCard";
import { messageOf } from "./format";
import { useBand, type BandLight } from "./useBand";
import { usePhoneMic } from "./usePhoneMic";
import { VoiceOrb } from "./VoiceOrb";
import { idleVoice, micVoice, pushedVoice, type VoiceSource } from "./voice-meter";
import fx from "@/components/fx/Fx.module.css";

// Display name only. The connection itself still verifies the team band in band-identity.ts.
const BAND_LABEL = "Vexo Band";

type Rec = "idle" | "starting" | "recording" | "transcribing";

const LIGHT_LABEL: Record<BandLight, string> = {
  off: "Light off",
  mic: "Recording — tap to stop",
  ready_amber: "Amber: double-tap to send",
  blocked_red: "Red: needs an answer",
  sent_blue: "Blue: sent (solid)",
  paid_green: "Green: paid",
};

function clock(seconds: number): string {
  const whole = Math.min(MAX_AUDIO_SECONDS, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** The companion app: record the job (band, phone mic or typed), then send and get paid. */
export function CaptureScreen() {
  const flow = useInvoiceFlow();
  const band = useBand();
  const mic = usePhoneMic();
  const [rec, setRec] = useState<Rec>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const recordingFrom = useRef<"band" | "phone">("phone");
  const [voice, setVoice] = useState<VoiceSource | null>(null);
  const voiceRef = useRef<VoiceSource | null>(null);

  const { phase, invoice, transcript, error, send, reset, draftFromCapture } = flow;
  const { status: bandStatus, showLight, onDoubleTap, onTap, onLevel } = band;
  const bandReady = bandStatus === "connected" || bandStatus === "recording";
  const ready = invoice !== null && invoice.unresolved.length === 0;
  const busy = phase === "drafting" || phase === "sending" || rec === "starting" || rec === "transcribing";
  const sendArmed = phase === "draft" && ready;
  const unresolvedCount = invoice?.unresolved.length ?? 0;

  useEffect(() => {
    if (rec !== "recording") return;
    const started = performance.now();
    const id = window.setInterval(() => setElapsed((performance.now() - started) / 1000), 200);
    return () => window.clearInterval(id);
  }, [rec]);

  // Never leave a listen-only mic stream open after leaving the page.
  useEffect(() => () => voiceRef.current?.stop(), []);

  const startVoice = useCallback(
    async (from: "band" | "phone") => {
      let next: VoiceSource;
      if (from === "band") {
        const pushed = pushedVoice();
        onLevel(pushed.push);
        next = pushed;
      } else {
        // Animate straight away, then switch to the live mic levels once they're ready.
        const idle = idleVoice();
        voiceRef.current = idle;
        setVoice(idle);
        next = await micVoice().catch(() => idle);
        if (voiceRef.current !== idle) {
          // Recording already stopped (or restarted) while the mic was opening.
          if (next !== idle) next.stop();
          return;
        }
      }
      voiceRef.current = next;
      setVoice(next);
    },
    [onLevel],
  );

  const stopVoice = useCallback(() => {
    voiceRef.current?.stop();
    voiceRef.current = null;
    onLevel(null);
    setVoice(null);
  }, [onLevel]);

  const draftFrom = useCallback(
    (capture: Capture) => draftFromCapture(capture),
    [draftFromCapture],
  );

  const startRecording = useCallback(async () => {
    setNote(null);
    setElapsed(0);
    recordingFrom.current = bandReady ? "band" : "phone";
    setRec("starting");
    try {
      if (recordingFrom.current === "band") await band.startRecording();
      else await mic.start();
      setRec("recording");
      void startVoice(recordingFrom.current);
    } catch (err) {
      setRec("idle");
      setNote(messageOf(err, "Couldn’t start recording."));
    }
  }, [band, bandReady, mic, startVoice]);

  const stopRecording = useCallback(async () => {
    stopVoice();
    setRec("transcribing");
    try {
      const capture =
        recordingFrom.current === "band"
          ? await transcribeBandRecording(await band.stopRecording())
          : await transcribeBrowserMic(await mic.stop());
      setRec("idle");
      await draftFrom(capture);
    } catch (err) {
      setRec("idle");
      setNote(messageOf(err, "Couldn’t hear that. Try again."));
    }
  }, [band, draftFrom, mic, stopVoice]);

  // Amber + double-tap to send; red when blocked; blue/green after send. Skip while mic owns the wrist LED.
  useEffect(() => {
    if (bandStatus !== "connected") {
      onDoubleTap(null);
      return;
    }
    let cancelled = false;

    const run = async () => {
      if (sendArmed) {
        onTap(null);
        onDoubleTap(() => {
          onDoubleTap(null);
          onTap(null);
          void showLight("sent_blue");
          void send();
        });
        if (!cancelled) await showLight("ready_amber");
        return;
      }

      onDoubleTap(null);
      if (cancelled) return;
      if (phase === "draft") await showLight("blocked_red");
      else if (phase === "sending" || phase === "sent") await showLight("sent_blue");
      else if (phase === "paid") await showLight("paid_green");
      else if (phase === "idle") await showLight("off");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [bandStatus, phase, sendArmed, unresolvedCount, send, showLight, onDoubleTap, onTap]);

  // Single tap: start/stop recording when not in amber-send mode.
  useEffect(() => {
    if (!bandReady || sendArmed || busy) {
      if (!sendArmed) onTap(null);
      return;
    }
    if (rec === "recording") {
      onTap(() => void stopRecording());
      return () => onTap(null);
    }
    onTap(() => void startRecording());
    return () => onTap(null);
  }, [bandReady, sendArmed, busy, rec, onTap, startRecording, stopRecording]);

  useEffect(
    () => () => {
      onDoubleTap(null);
      onTap(null);
    },
    [onDoubleTap, onTap],
  );

  function startOver() {
    setNote(null);
    reset();
  }

  let pose: TallyPose = "listening";
  let headline = bandReady ? "Tap your band to record." : "Tap to record the job.";
  if (rec === "recording") headline = "Listening… tap the band to stop.";
  else if (rec === "transcribing" || rec === "starting") {
    pose = "writing";
    headline = rec === "starting" ? "Getting ready…" : "Got it. Writing it up…";
  } else if (phase === "drafting") {
    pose = "writing";
    headline = "Pricing from your list…";
  } else if (phase === "draft") {
    pose = ready ? "writing" : "question";
    headline = ready ? (bandReady ? "Double-tap your band to send." : "Ready. Double-tap to send.") : "One question first.";
  } else if (phase === "sending") {
    pose = "writing";
    headline = "Sending through Stripe…";
  } else if (phase === "sent") {
    headline = "Sent. Waiting for payment…";
  } else if (phase === "paid") {
    pose = "paid";
    headline = "Paid.";
  }

  const recording = rec === "recording";
  const problem = note ?? error ?? band.error;

  return (
    <div className={`${styles.stage} ${styles.onDark}`} data-voice-root>
      <div className={styles.stageGrid}>
        <div className={styles.recorder}>
          <div className={styles.stageTop}>
            <span className={styles.tally} aria-hidden="true">
              {(Object.keys(TALLY_POSES) as TallyPose[]).map((key) => (
                <Image key={key} src={TALLY_POSES[key].src} alt="" className={styles.tallyPose} data-on={key === pose} unoptimized />
              ))}
            </span>

            {bandReady ? (
              <div className={styles.bandPill}>
                <span className={styles.light} data-light={band.light} aria-hidden="true" />
                <span>
                  {BAND_LABEL}
                  <span className={styles.bandSub}>{LIGHT_LABEL[band.light]}</span>
                </span>
                <button type="button" className={styles.bandOff} onClick={() => void band.disconnect()} disabled={recording}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`${styles.connectBtn} ${fx.fx}`}
                onClick={() => void band.connect()}
                disabled={bandStatus === "connecting" || Boolean(band.unavailable)}
                title={band.unavailable ?? undefined}
              >
                <span className={styles.light} data-light="off" aria-hidden="true" />
                {band.unavailable
                  ? "Band needs Chrome or Edge"
                  : bandStatus === "connecting"
                    ? "Connecting…"
                    : "Connect Vexo Band"}
              </button>
            )}
          </div>

          <h1 className={styles.headline} aria-live="polite">
            {headline}
          </h1>
          {transcript ? <p className={styles.transcript}>“{transcript}”</p> : null}

          <div className={styles.recordRow}>
            <VoiceOrb source={voice}>
              <button
                type="button"
                className={styles.recordBtn}
                data-recording={recording}
                aria-pressed={recording}
                aria-label={recording ? "Stop recording" : "Record the job"}
                disabled={busy && !recording}
                onClick={() => void (recording ? stopRecording() : startRecording())}
              >
                {recording ? (
                  <span className={styles.stopIcon} />
                ) : (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
                  </svg>
                )}
              </button>
            </VoiceOrb>
            <div className={styles.recordText}>
              {recording ? (
                <>
                  <span className={styles.clock}>
                    {clock(elapsed)} / {clock(MAX_AUDIO_SECONDS)}
                  </span>
                  <span className={styles.recordHint}>{bandReady ? "Tap the band to stop" : "Tap to stop"}</span>
                </>
              ) : (
                <>
                  <span className={styles.recordLabel}>
                    {bandReady ? `Tap ${BAND_LABEL} to record` : "Record with this phone"}
                  </span>
                </>
              )}
            </div>
          </div>

          {problem ? (
            <p role="alert" className={styles.alert}>
              {problem}
            </p>
          ) : null}
        </div>

        <InvoiceCard invoice={invoice} phase={phase} bandArmed={bandReady} onSend={() => void send()} onReset={startOver} />
      </div>
    </div>
  );
}
