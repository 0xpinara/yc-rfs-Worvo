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
import { draftSource, messageOf } from "./format";
import { useBand, type BandLight } from "./useBand";
import { usePhoneMic } from "./usePhoneMic";
import fx from "@/components/fx/Fx.module.css";

// Display name only. The connection itself still verifies the team band in band-identity.ts.
const BAND_LABEL = "Vexo 123";

type Rec = "idle" | "starting" | "recording" | "transcribing";

const LIGHT_LABEL: Record<BandLight, string> = {
  off: "Light off",
  mic: "Mic on",
  ready_amber: "Amber: double-tap to send",
  blocked_red: "Red: needs an answer",
  sent_blue: "Blue: sent",
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

  const { phase, invoice, transcript, error, send, reset, draftFromTranscript } = flow;
  const { status: bandStatus, showLight, onDoubleTap } = band;
  const bandReady = bandStatus === "connected" || bandStatus === "recording";
  const ready = invoice !== null && invoice.unresolved.length === 0;
  const busy = phase === "drafting" || phase === "sending" || rec === "starting" || rec === "transcribing";

  useEffect(() => {
    if (rec !== "recording") return;
    const started = performance.now();
    const id = window.setInterval(() => setElapsed((performance.now() - started) / 1000), 200);
    return () => window.clearInterval(id);
  }, [rec]);

  // Mirror the invoice on the band: amber + double-tap when it can go out, red when it can't,
  // blue once sent, green when paid. The band ignores colours while its mic is on.
  const unresolvedCount = invoice?.unresolved.length ?? 0;
  useEffect(() => {
    if (bandStatus !== "connected") return;
    if (phase === "draft" && unresolvedCount === 0) {
      void showLight("ready_amber");
      onDoubleTap(() => void send());
    } else {
      onDoubleTap(null);
      if (phase === "draft") void showLight("blocked_red");
      else if (phase === "sent") void showLight("sent_blue");
      else if (phase === "paid") void showLight("paid_green");
      else if (phase === "idle") void showLight("off");
    }
  }, [bandStatus, phase, unresolvedCount, send, showLight, onDoubleTap]);

  useEffect(() => () => onDoubleTap(null), [onDoubleTap]);

  const draftFrom = useCallback(
    (capture: Capture) => draftFromTranscript(capture.transcript, draftSource(capture.source), capture.sourceId),
    [draftFromTranscript],
  );

  async function startRecording() {
    setNote(null);
    setElapsed(0);
    recordingFrom.current = bandReady ? "band" : "phone";
    setRec("starting");
    try {
      if (recordingFrom.current === "band") await band.startRecording();
      else await mic.start();
      setRec("recording");
    } catch (err) {
      setRec("idle");
      setNote(messageOf(err, "Couldn’t start recording."));
    }
  }

  async function stopRecording() {
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
  }

  function startOver() {
    setNote(null);
    reset();
  }

  let pose: TallyPose = "listening";
  let headline = "Tap to record the job.";
  if (rec === "recording") headline = "Listening…";
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
    <div className={`${styles.stage} ${styles.onDark}`}>
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
                    : `Connect ${BAND_LABEL}`}
              </button>
            )}
          </div>

          <h1 className={styles.headline} aria-live="polite">
            {headline}
          </h1>
          {transcript ? <p className={styles.transcript}>“{transcript}”</p> : null}

          <div className={styles.recordRow}>
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
            <div className={styles.recordText}>
              {recording ? (
                <>
                  <span className={styles.wave} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className={styles.clock}>
                    {clock(elapsed)} / {clock(MAX_AUDIO_SECONDS)}
                  </span>
                  <span className={styles.recordHint}>Tap to stop</span>
                </>
              ) : (
                <>
                  <span className={styles.recordLabel}>{bandReady ? `Record on ${BAND_LABEL}` : "Record with this phone"}</span>
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
