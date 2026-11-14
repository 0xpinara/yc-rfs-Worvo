"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { InvoiceViewSchema, type InvoiceView } from "@/shared/contracts";
import { TALLY_POSES } from "@/components/landing/tally-art";
import styles from "./App.module.css";
import { invoiceStatus, lineSummary, money } from "./format";
import fx from "@/components/fx/Fx.module.css";

const ListResponse = z.object({ ok: z.literal(true), data: z.object({ invoices: z.array(InvoiceViewSchema) }) });

/** Every invoice this server has drafted, newest first, refreshed every few seconds. */
export function InvoiceList() {
  const [invoices, setInvoices] = useState<InvoiceView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/invoices", { cache: "no-store" });
        const parsed = ListResponse.safeParse(await response.json());
        if (!active) return;
        if (parsed.success) {
          setInvoices([...parsed.data.data.invoices].reverse());
          setError(null);
        } else {
          setError("Couldn’t read the invoice list.");
        }
      } catch {
        if (active) setError("Can’t reach the Worvo server.");
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const paidCents = invoices?.filter((i) => i.paymentStatus === "paid").reduce((sum, i) => sum + i.totalCents, 0) ?? 0;
  const openCents =
    invoices?.filter((i) => i.paymentStatus !== "paid" && i.sendStatus === "succeeded").reduce((sum, i) => sum + i.totalCents, 0) ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Invoices.</h1>
        {invoices && invoices.length > 0 ? (
          <dl className={styles.stats}>
            <div>
              <dt>Paid</dt>
              <dd>{money(paidCents)}</dd>
            </div>
            <div>
              <dt>Waiting</dt>
              <dd>{money(openCents)}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className={styles.alertLight}>
          {error}
        </p>
      ) : null}

      {invoices === null && !error ? (
        <div className={styles.listSkeleton} aria-label="Loading invoices">
          <span />
          <span />
        </div>
      ) : null}

      {invoices && invoices.length === 0 ? (
        <div className={styles.emptyState}>
          <Image src={TALLY_POSES.listening.src} alt="" className={styles.emptyTally} unoptimized />
          <p className={styles.emptyTitle}>No invoices yet.</p>
          <Link href="/app" className={`${styles.primaryLink} ${fx.fx}`}>
            Record a job
          </Link>
        </div>
      ) : null}

      {invoices && invoices.length > 0 ? (
        <ul className={styles.list}>
          {invoices.map((invoice) => {
            const status = invoiceStatus(invoice);
            return (
              <li key={invoice.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.rowName}>{invoice.customerName ?? "Unknown customer"}</span>
                  <span className={styles.rowSub}>{lineSummary(invoice)}</span>
                </div>
                <div className={styles.rowSide}>
                  <span className={styles.rowTotal}>{invoice.unresolved.length > 0 ? "—" : money(invoice.totalCents)}</span>
                  <span className={styles.chip} data-tone={status.tone}>
                    {status.label}
                  </span>
                  {invoice.hostedInvoiceUrl && invoice.paymentStatus !== "paid" ? (
                    <a className={styles.link} href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                      Payment page
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
