"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./Landing.module.css";
import { TALLY_POSES, TALLY_WAVE, type TallyPose } from "./tally-art";

const HELLOS = ["Hi, I’m Tally.", "Tell me about the job.", "I’ll write it up.", "Double-tap and done.", "Your prices. Always."];

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Hero Tally: waving on a soft disc. Click him and he says something new. */
export function TallyHero() {
  const [hello, setHello] = useState(0);
  return (
    <div className={styles.tallyHero}>
      <div className={styles.tallyRing} aria-hidden="true" />
      <div className={styles.tallyDisc} aria-hidden="true" />
      <button
        type="button"
        className={styles.tallyButton}
        aria-label="Say hi to Tally"
        onClick={() => setHello((n) => n + 1)}
      >
        <Image
          key={hello}
          src={TALLY_WAVE.src}
          alt={TALLY_WAVE.alt}
          className={styles.tallyFigure}
          data-wiggle={hello > 0}
          unoptimized
          loading="eager"
          fetchPriority="high"
        />
      </button>
      <p key={hello} className={styles.tallyHello} data-again={hello > 0} aria-live="polite">
        {HELLOS[hello % HELLOS.length]}
      </p>
    </div>
  );
}

/** Small round Tally that cross-fades between poses as the demo moves along. */
export function TallyBadge({ pose }: { pose: TallyPose }) {
  return (
    <span className={styles.tallyBadge} aria-hidden="true">
      {(Object.keys(TALLY_POSES) as TallyPose[]).map((key) => (
        <Image key={key} src={TALLY_POSES[key].src} alt="" className={styles.tallyBadgePose} data-on={key === pose} unoptimized />
      ))}
    </span>
  );
}

const STEPS: { pose: TallyPose; title: string; line: string }[] = [
  { pose: "listening", title: "Record", line: "Talk while you pack up. No forms." },
  { pose: "writing", title: "Draft", line: "Your words, your prices, to the cent." },
  { pose: "question", title: "Ask", line: "Unsure? Tally asks instead of guessing." },
  { pose: "paid", title: "Get paid", line: "Double-tap to send. Tally floats when it’s paid." },
];

/** "How it works" told by Tally: four steps that play on their own and can be clicked. */
export function TallySteps() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % STEPS.length), 3200);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  const step = STEPS[active];
  return (
    <section id="how" aria-labelledby="how-title" className={styles.how}>
      <div className={styles.howInner}>
        <div className={styles.howStage} aria-hidden="true">
          {STEPS.map((s) => (
            <Image key={s.pose} src={TALLY_POSES[s.pose].src} alt="" className={styles.howPose} data-on={s === step} unoptimized />
          ))}
        </div>
        <div className={styles.howCopy}>
          <h2 id="how-title" className={styles.h2}>
            Meet Tally.
          </h2>
          <p className={styles.howLead}>From job to paid in four steps.</p>
          <div
            role="tablist"
            aria-label="How it works"
            className={styles.howTabs}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={styles.howTab}
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
              >
                <span className={styles.howNum}>{i + 1}</span>
                <span>{s.title}</span>
                {i === active && !paused && !reduced ? <span key={active} className={styles.howTimer} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
          <p role="tabpanel" aria-live="polite" className={styles.howLine} key={active}>
            {step.line}
          </p>
        </div>
      </div>
    </section>
  );
}
