import Image from "next/image";
import styles from "./Landing.module.css";
import { TALLY_POSE_ORDER, TALLY_POSES, TALLY_WAVE, type TallyPose } from "./tally-art";

/** Hero Tally: waving on a soft disc, as in the mascot artboard. */
export function TallyHero() {
  return (
    <div className={styles.tallyHero}>
      <div className={styles.tallyRing} aria-hidden="true" />
      <div className={styles.tallyDisc} aria-hidden="true" />
      <Image
        src={TALLY_WAVE.src}
        alt={TALLY_WAVE.alt}
        className={styles.tallyFigure}
        unoptimized
        loading="eager"
        fetchPriority="high"
      />
      <p className={styles.tallyHello}>Hi, I’m Tally.</p>
    </div>
  );
}

/** Small round Tally that cross-fades between poses as the demo moves along. */
export function TallyBadge({ pose }: { pose: TallyPose }) {
  return (
    <span className={styles.tallyBadge} aria-hidden="true">
      {TALLY_POSE_ORDER.map((key) => (
        <Image key={key} src={TALLY_POSES[key].src} alt="" className={styles.tallyBadgePose} data-on={key === pose} unoptimized />
      ))}
    </span>
  );
}

/** "Meet Tally" section: the four poses and what each one means. */
export function MeetTally() {
  return (
    <section aria-labelledby="tally-title" className={styles.meet}>
      <div className={styles.meetInner}>
        <div className={styles.meetCopy}>
          <h2 id="tally-title" className={styles.h2}>
            Meet Tally.
          </h2>
          <p className={`${styles.body} ${styles.meetText}`}>
            Worvo’s sea otter. Sea otters are one of the few animals that use tools, so Tally carries a wrench, keeps a
            pencil behind one ear, and wears a wristband that listens.
          </p>
        </div>
        <ul className={styles.poses}>
          {TALLY_POSE_ORDER.map((key) => {
            const pose = TALLY_POSES[key];
            return (
              <li key={key} className={styles.pose}>
                <Image src={pose.src} alt={pose.alt} className={styles.poseImg} unoptimized />
                <span className={styles.poseTitle}>{pose.title}</span>
                <span className={styles.poseCaption}>{pose.caption}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
