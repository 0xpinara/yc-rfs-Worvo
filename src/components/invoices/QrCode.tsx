"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import styles from "./InvoiceScreen.module.css";

export function QrCode({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M" })
      .then((markup) => active && setSvg(markup))
      .catch(() => active && setSvg(null));
    return () => {
      active = false;
    };
  }, [value]);

  // The markup comes from the qrcode library, not from user input.
  return svg
    ? <div className={styles.qr} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
    : <div className={styles.qr} aria-hidden="true" />;
}
