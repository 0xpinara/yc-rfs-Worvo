"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./Landing.module.css";
import { CheckIcon, PhoneIcon, ReplayIcon } from "./icons";
import { TallyBadge } from "./Tally";
import type { TallyPose } from "./tally-art";
import {
  DEMO_ENDS,
  DEMO_JOBS,
  DEMO_TIMES,
  DEMO_WORDS,
  demoTotalCents,
  formatCents,
  type PartKey,
  type ScenarioKey,
} from "./demo-script";

type Phase = "listening" | "drafting" | "held" | "ready" | "sending" | "sent" | "paid";

type DemoState = {
  scenario: ScenarioKey;
  /** Bumped on every (re)play so the same scenario can restart. */
  runId: number;
  /** Number of words heard so far. */
  step: number;
  phase: Phase;
  answered: boolean;
  hover: PartKey | null;
};

const CHIPS: Record<Phase, { text: string; tone: "neutral" | "question" | "ready" | "sent" }> = {
  listening: { text: "Listening", tone: "neutral" },
  drafting: { text: "Drafting", tone: "neutral" },
  held: { text: "1 question", tone: "question" },
  ready: { text: "Ready to send", tone: "ready" },
  sending: { text: "Sending", tone: "ready" },
  sent: { text: "Sent", tone: "sent" },
  paid: { text: "Paid", tone: "sent" },
};

const NOTES: Record<Phase, string> = {
  listening: "Listening…",
  drafting: "Matching the customer and your saved prices…",
  held: "One question before this can go out.",
  ready: "Draft ready. Nothing sends until you confirm.",
  sending: "Sending through Stripe…",
  sent: "Sent. Juniper Cafe gets the invoice with a payment page.",
  paid: "Paid. Juniper Cafe paid on the Stripe payment page.",
};

/** Which Tally pose matches each moment of the demo. */
const POSE: Record<Phase, TallyPose> = {
  listening: "listening",
  drafting: "writing",
  held: "question",
  ready: "writing",
  sending: "writing",
  sent: "writing",
  paid: "paid",
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const finalPhase = (scenario: ScenarioKey): Phase => (scenario === "held" ? "held" : "ready");

/** Animated sample: the spoken request fills in an invoice, phrase by phrase. */
export function HeroDemo() {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  const [st, setSt] = useState<DemoState>({
    scenario: "ready",
    runId: 0,
    step: 0,
    phase: "listening",
    answered: false,
    hover: null,
  });

  // Play back the spoken request word by word, then draft the invoice.
  useEffect(() => {
    if (reduced) return;
    const times = DEMO_TIMES[st.scenario];
    const total = times.length;
    const done = finalPhase(st.scenario);
    const start = performance.now();
    const waits: number[] = [];
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - start;
      let heard = 0;
      while (heard < total && times[heard] <= elapsed) heard += 1;
      setSt((prev) => (prev.step === heard ? prev : { ...prev, step: heard }));
      if (heard >= total) {
        window.clearInterval(tick);
        waits.push(window.setTimeout(() => setSt((prev) => ({ ...prev, phase: "drafting" })), 200));
        waits.push(window.setTimeout(() => setSt((prev) => ({ ...prev, phase: done })), 1200));
      }
    }, 40);
    return () => {
      window.clearInterval(tick);
      waits.forEach((id) => window.clearTimeout(id));
    };
  }, [st.scenario, st.runId, reduced]);

  // After confirming: "sending" settles to "sent", then the sample invoice gets paid.
  useEffect(() => {
    const next: Partial<Record<Phase, { phase: Phase; ms: number }>> = {
      sending: { phase: "sent", ms: 1100 },
      sent: { phase: "paid", ms: 1800 },
    };
    const step = next[st.phase];
    if (!step) return;
    const from = st.phase;
    const id = window.setTimeout(
      () => setSt((prev) => (prev.phase === from ? { ...prev, phase: step.phase } : prev)),
      reduced ? 0 : step.ms,
    );
    return () => window.clearTimeout(id);
  }, [st.phase, reduced]);

  const play = (scenario: ScenarioKey) =>
    setSt((prev) => ({ scenario, runId: prev.runId + 1, step: 0, phase: "listening", answered: false, hover: null }));
  const setHover = (hover: PartKey | null) => setSt((prev) => ({ ...prev, hover }));
  const answer = () => setSt((prev) => ({ ...prev, answered: true, phase: "ready", hover: null }));
  const confirm = () => setSt((prev) => (prev.phase === "ready" ? { ...prev, phase: "sending" } : prev));

  const job = DEMO_JOBS[st.scenario];
  const words = DEMO_WORDS[st.scenario];
  const ends = DEMO_ENDS[st.scenario];
  const total = words.length;

  // With reduced motion there is no playback: show the finished draft straight away.
  const playing = st.phase === "listening" || st.phase === "drafting";
  const step = reduced ? total : st.step;
  const phase: Phase = reduced && playing ? finalPhase(st.scenario) : st.phase;

  const heard = (part: PartKey) => {
    const end = ends[part];
    return end !== undefined && step >= end;
  };

  const open = job.lines.some((line) => line.fix && !st.answered);
  const drafted = step >= total && phase !== "listening";
  const canSend = phase === "ready";
  const sentNow = phase === "sent" || phase === "paid";
  const paidNow = phase === "paid";
  const chip = CHIPS[phase];

  let confirmNote = "Unlocks when the draft is complete.";
  if (canSend) confirmNote = "You’ll confirm with one tap on your phone.";
  else if (phase === "held") confirmNote = "Answer the question first.";

  const track = [
    { state: "done", label: "Confirmed by you", sub: "This exact invoice and recipient" },
    {
      state: sentNow ? "done" : "now",
      label: sentNow ? "Sent through Stripe" : "Sending through Stripe",
      sub: "Email with a payment page and PDF",
    },
    {
      state: paidNow ? "done" : "next",
      label: "Paid",
      sub: paidNow ? "Paid on the Stripe payment page" : "Shows here when Juniper Cafe pays",
    },
  ] as const;

  return (
    <>
      <div className={styles.demoBar}>
        <div role="group" aria-label="Example job" className={styles.segmented}>
          <button type="button" className={styles.segBtn} aria-pressed={st.scenario === "ready"} onClick={() => play("ready")}>
            Everything’s on file
          </button>
          <button type="button" className={styles.segBtn} aria-pressed={st.scenario === "held"} onClick={() => play("held")}>
            Something’s unclear
          </button>
        </div>
        <button type="button" className={styles.replay} onClick={() => play(st.scenario)}>
          <ReplayIcon />
          <span>Replay</span>
        </button>
      </div>

      <div className={styles.demo}>
        <div className={styles.speech}>
          <p className={styles.quote}>
            <span className={styles.quoteMark}>“</span>
            {words.map((word, i) => {
              const recognized = word.part !== null && heard(word.part);
              return (
                <span
                  key={`${st.scenario}-${i}`}
                  className={styles.token}
                  data-spoken={i < step}
                  data-part={word.part ?? undefined}
                  data-recognized={recognized}
                  data-hot={recognized && st.hover === word.part}
                >
                  {word.text}
                </span>
              );
            })}
            <span className={styles.quoteMark}>”</span>
          </p>
          <div aria-live="polite" className={styles.status}>
            <TallyBadge pose={POSE[phase]} />
            {phase === "listening" ? (
              <span className={styles.wave} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
            ) : null}
            <span>{NOTES[phase]}</span>
          </div>
        </div>

        <div className={styles.paper}>
          <div className={styles.paperHead}>
            <span className={styles.paperLabel}>Sample invoice</span>
            <span className={styles.chip} data-tone={chip.tone}>
              {chip.text}
            </span>
          </div>

          <div className={styles.meta}>
            <div className={styles.reveal} data-on={heard("customer")}>
              <div className={styles.metaLabel}>Bill to</div>
              <div className={styles.metaValue}>Juniper Cafe</div>
              <div className={styles.metaSub} data-on={heard(job.emailFrom)}>
                Saved billing email
              </div>
            </div>
            <div className={styles.reveal} data-on={heard("service")}>
              <div className={styles.metaLabel}>Service</div>
              <div className={styles.metaValue}>{job.service}</div>
              <div className={styles.metaSub}>Today</div>
            </div>
          </div>

          <ul className={styles.lines}>
            {job.lines.map((line) => {
              const fixed = line.fix && st.answered ? line.fix : null;
              const pending = Boolean(line.fix) && !st.answered;
              const shown = fixed ?? line;
              return (
                <li
                  key={line.id}
                  className={styles.line}
                  data-on={heard(line.id)}
                  data-hot={st.hover === line.id}
                  onMouseEnter={() => setHover(line.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div className={styles.lineTop}>
                    <span className={styles.lineName}>{shown.name}</span>
                    <span className={styles.lineAmount} data-pending={pending}>
                      {pending ? "Pending" : formatCents(shown.cents)}
                    </span>
                  </div>
                  <div className={styles.lineDetail}>{shown.detail}</div>
                  <div className={styles.lineQuote}>“{line.quote}”</div>
                  {fixed ? (
                    <div className={styles.lineNote}>
                      <PhoneIcon />
                      <span>{fixed.note}</span>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {phase === "held" && open ? (
            <div className={styles.question}>
              <div className={styles.questionRow}>
                <span className={styles.questionBadge} aria-hidden="true">
                  ?
                </span>
                <div>
                  <div className={styles.questionTitle}>Which parts make up the $45?</div>
                  <div className={styles.questionText}>Worvo only bills parts it can match to your price list.</div>
                </div>
              </div>
              <button type="button" className={styles.answerBtn} onClick={answer}>
                Answer: two shutoff valves
              </button>
            </div>
          ) : null}

          <div className={styles.total} data-on={drafted}>
            <span className={styles.totalLabel}>Total due</span>
            <span className={styles.totalValue} data-pending={open}>
              {open ? "Pending" : formatCents(demoTotalCents(job, st.answered))}
            </span>
          </div>

          {phase === "sending" || phase === "sent" || phase === "paid" ? (
            <ol aria-label="Invoice status" className={styles.track}>
              {track.map((mark) => (
                <li key={mark.label} className={styles.trackItem}>
                  {mark.state === "done" ? (
                    <span className={styles.markDone} aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : (
                    <span className={mark.state === "now" ? styles.markNow : styles.markNext} aria-hidden="true" />
                  )}
                  <span className={styles.trackText}>
                    <span className={styles.trackLabel} data-muted={mark.state === "next"}>
                      {mark.label}
                    </span>
                    <span className={styles.trackSub}>{mark.sub}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.confirm}>
              <button type="button" className={styles.confirmBtn} disabled={!canSend} onClick={confirm}>
                Confirm and send
              </button>
              <span className={styles.confirmNote}>{confirmNote}</span>
            </div>
          )}

          <p className={styles.taxNote}>Tax not assessed in this sample.</p>
        </div>
      </div>
    </>
  );
}
