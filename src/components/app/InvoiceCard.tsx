"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { InvoiceView } from "@/shared/contracts";
import type { FlowPhase } from "@/components/invoices/useInvoiceFlow";
import styles from "./App.module.css";
import { Qr } from "./Qr";
import { invoiceStatus, lineDetail, money, questions } from "./format";

/** Sends on a second tap within 450 ms, like the band. Works with mouse, touch and keyboard. */
export function DoubleTapButton({ onSend, label = "Double-tap to send" }: { onSend: () => void; label?: string }) {
  const lastTap = useRef(0);
  const [nudge, setNudge] = useState(0);
  return (
    <button
      type="button"
      className={styles.sendBtn}
      data-nudge={nudge === 0 ? undefined : nudge % 2 ? "a" : "b"}
      onClick={(event) => {
        if (event.timeStamp - lastTap.current < 450) {
          lastTap.current = 0;
          onSend();
        } else {
          lastTap.current = event.timeStamp;
          setNudge((n) => n + 1);
        }
      }}
    >
      {label}
    </button>
  );
}

type Props = {
  invoice: InvoiceView | null;
  phase: FlowPhase;
  bandArmed: boolean;
  onSend: () => void;
  onReset: () => void;
};

export function InvoiceCard({ invoice, phase, bandArmed, onSend, onReset }: Props) {
  const status = invoice
    ? invoiceStatus(invoice)
    : phase === "drafting"
      ? { label: "Writing", tone: "neutral" as const }
      : { label: "Waiting", tone: "neutral" as const };
  const ready = invoice !== null && invoice.unresolved.length === 0;
  const open = invoice ? questions(invoice.unresolved) : [];

  return (
    <section className={styles.paper} aria-label="Invoice" aria-live="polite">
      <div className={styles.paperHead}>
        <span className={styles.paperLabel}>Invoice</span>
        <span className={styles.chip} data-tone={status.tone}>
          {status.label}
        </span>
      </div>

      {!invoice ? (
        phase === "drafting" ? (
          <div className={styles.skeleton} aria-label="Writing the invoice">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <p className={styles.empty}>Record a job and the invoice shows up here.</p>
        )
      ) : (
        <>
          <div className={styles.meta}>
            <div>
              <div className={styles.metaLabel}>Bill to</div>
              <div className={styles.metaValue}>{invoice.customerName ?? "Who is this for?"}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>Send to</div>
              <div className={styles.metaSub}>{invoice.recipient ?? "No saved email"}</div>
            </div>
          </div>

          {invoice.lines.length > 0 ? (
            <ul className={styles.lines}>
              {invoice.lines.map((line) => (
                <li key={`${line.description}-${line.quantity}`} className={styles.line}>
                  <div className={styles.lineTop}>
                    <span className={styles.lineName}>{line.description}</span>
                    <span className={styles.lineAmount}>{money(line.amountCents)}</span>
                  </div>
                  <div className={styles.lineDetail}>{lineDetail(line)}</div>
                </li>
              ))}
            </ul>
          ) : null}

          {open.length > 0 ? (
            <div className={styles.question}>
              <span className={styles.questionBadge} aria-hidden="true">
                ?
              </span>
              <div>
                <div className={styles.questionTitle}>{open.length === 1 ? "One question first" : "A few questions first"}</div>
                <ul className={styles.questionList}>
                  {open.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className={styles.total}>
            <span className={styles.totalLabel}>Total due</span>
            <span className={styles.totalValue} data-pending={!ready}>
              {ready ? money(invoice.totalCents) : "Pending"}
            </span>
          </div>

          {phase === "paid" ? (
            <div className={styles.paid}>
              <span className={styles.paidCheck} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <div>
                <div className={styles.paidTitle}>Paid</div>
                <div className={styles.metaSub}>{money(invoice.totalCents)} through Stripe</div>
              </div>
            </div>
          ) : phase === "sent" && invoice.hostedInvoiceUrl ? (
            <div className={styles.scan}>
              <Qr value={invoice.hostedInvoiceUrl} label={`QR code to pay ${money(invoice.totalCents)}`} />
              <div>
                <div className={styles.scanTitle}>Scan to pay {money(invoice.totalCents)}</div>
                <div className={styles.waiting}>
                  <span className={styles.pulse} aria-hidden="true" /> Waiting for payment…
                </div>
                <a className={styles.link} href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                  Open payment page
                </a>
              </div>
            </div>
          ) : phase === "sending" ? (
            <button type="button" className={styles.sendBtn} disabled>
              Sending…
            </button>
          ) : ready ? (
            <div className={styles.sendWrap}>
              <DoubleTapButton onSend={onSend} />
              <span className={styles.sendNote}>{bandArmed ? "Or double-tap your band." : "Tap twice to send."}</span>
            </div>
          ) : invoice.unresolved.every((field) => field === "recipient") ? (
            <p className={styles.sendNote}>
              Their billing email isn’t saved yet. Check <Link href="/app/prices">Prices</Link>.
            </p>
          ) : (
            <p className={styles.sendNote}>Say it again with the missing details.</p>
          )}

          {phase !== "sending" ? (
            <button type="button" className={styles.resetBtn} onClick={onReset}>
              New invoice
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
