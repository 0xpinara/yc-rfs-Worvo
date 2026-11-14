import styles from "./Landing.module.css";

/** Worvo mark: a listening ring around a dot. `tone="dark"` is for light backgrounds. */
export function WorvoMark({ size = 26, tone = "light" }: { size?: number; tone?: "light" | "dark" }) {
  const color = tone === "dark" ? "var(--blue)" : "var(--sky)";
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="11" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="13" cy="13" r="4.5" fill={color} />
    </svg>
  );
}

export function ReplayIcon() {
  return (
    <svg className={styles.ic} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5v4.5H8" />
    </svg>
  );
}

/** The wristband, shown once Worvo has stopped listening. */
export function BandIcon({ className }: { className?: string }) {
  return (
    <svg className={`${styles.ic} ${className ?? ""}`} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="7" width="11" height="10" rx="3" />
      <path d="M8.5 7V3.5h7V7" />
      <path d="M8.5 17v3.5h7V17" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg className={styles.ic} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg className={styles.ic} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
