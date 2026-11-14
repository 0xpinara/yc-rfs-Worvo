"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import styles from "./App.module.css";

/** QR code for Stripe's hosted payment page, drawn in Worvo ink. */
export function Qr({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b1d3a", light: "#ffffff" } })
      .then((markup) => active && setSvg(markup))
      .catch(() => active && setSvg(null));
    return () => {
      active = false;
    };
  }, [value]);

  // The markup comes from the qrcode library, not from user input.
  return svg ? (
    <div className={styles.qr} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <div className={styles.qr} aria-hidden="true" />
  );
}
