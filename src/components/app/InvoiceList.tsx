"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { InvoiceViewSchema, type InvoiceView } from "@/shared/contracts";
import { TALLY_POSES } from "@/components/landing/tally-art";
import fx from "@/components/fx/Fx.module.css";
import styles from "./App.module.css";
import { invoiceStatus, lineSummary, money, shortDate, type StatusTone } from "./format";
import { invoiceCents, SAMPLE_BOOK, SAMPLE_TRADES, type SampleStatus } from "./sample-book";

const ListResponse = z.object({ ok: z.literal(true), data: z.object({ invoices: z.array(InvoiceViewSchema) }) });

type Row = {
  key: string;
  live: boolean;
  trade: string;
  business: string;
  monogram: string;
  customer: string;
  summary: string;
  said: string | null;
  question: string | null;
  totalCents: number | null;
  status: { label: string; tone: StatusTone };
  when: string;
  payUrl: string | null;
};

const SAMPLE_STATUS: Record<SampleStatus, { label: string; tone: StatusTone }> = {
  paid: { label: "Paid", tone: "paid" },
  sent: { label: "Sent", tone: "sent" },
  ready: { label: "Ready to send", tone: "ready" },
  question: { label: "Needs an answer", tone: "question" },
};

const monogramOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

// Synthetic sample invoices, newest first. Built once: the data is static.
const SAMPLE_ROWS: Row[] = SAMPLE_BOOK.flatMap((business) =>
  business.invoices.map((invoice) => ({
    key: invoice.number,
    live: false,
    trade: business.trade,
    business: business.name,
    monogram: monogramOf(business.name),
    customer: invoice.customer,
    summary: lineSummary(invoice.lines),
    said: invoice.said,
    question: invoice.question ?? null,
    totalCents: invoice.status === "question" ? null : invoiceCents(invoice),
    status: SAMPLE_STATUS[invoice.status],
    when: invoice.date,
    payUrl: null,
  })),
).sort((a, b) => (a.when === b.when ? a.key.localeCompare(b.key) : b.when.localeCompare(a.when)));

function liveRow(invoice: InvoiceView): Row {
  return {
    key: invoice.id,
    live: true,
    trade: "Live",
    business: "Your business",
    monogram: "You",
    customer: invoice.customerName ?? "Unknown customer",
    summary: lineSummary(invoice.lines),
    said: null,
    question: null,
    totalCents: invoice.unresolved.length > 0 ? null : invoice.totalCents,
    status: invoiceStatus(invoice),
    when: "Today",
    payUrl: invoice.hostedInvoiceUrl && invoice.paymentStatus !== "paid" ? invoice.hostedInvoiceUrl : null,
  };
}

/** Live invoices from this server first, then the synthetic sample book, filterable by trade. */
export function InvoiceList() {
  const [live, setLive] = useState<InvoiceView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trade, setTrade] = useState("All");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/invoices", { cache: "no-store" });
        const parsed = ListResponse.safeParse(await response.json());
        if (!active) return;
        if (parsed.success) {
          setLive([...parsed.data.data.invoices].reverse());
          setError(null);
        } else {
          setError("Couldn’t read live invoices. Showing the sample book.");
        }
      } catch {
        if (active) setError("Can’t reach the Worvo server. Showing the sample book.");
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const liveRows = (live ?? []).map(liveRow);
  const allRows = [...liveRows, ...SAMPLE_ROWS];
  const rows = trade === "All" ? allRows : allRows.filter((row) => row.trade === trade);
  const sumWhere = (tone: StatusTone) =>
    rows.filter((row) => row.status.tone === tone).reduce((sum, row) => sum + (row.totalCents ?? 0), 0);
  const filters = ["All", ...(liveRows.length > 0 ? ["Live"] : []), ...SAMPLE_TRADES];

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Invoices.</h1>
          <p className={styles.pageLead}>Every one started as a sentence said out loud.</p>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>Paid</dt>
            <dd>{money(sumWhere("paid"))}</dd>
          </div>
          <div>
            <dt>Waiting</dt>
            <dd>{money(sumWhere("sent"))}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.filters} role="group" aria-label="Filter by trade">
        {filters.map((name) => (
          <button
            key={name}
            type="button"
            className={styles.filter}
            aria-pressed={trade === name}
            onClick={() => setTrade(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <p className={styles.sampleNote}>
        Sample book: {SAMPLE_ROWS.length} synthetic invoices from {SAMPLE_BOOK.length} example businesses. Live invoices from this
        server are marked Live.
      </p>

      {error ? (
        <p role="alert" className={styles.alertLight}>
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className={styles.emptyState}>
          <Image src={TALLY_POSES.listening.src} alt="" className={styles.emptyTally} unoptimized />
          <p className={styles.emptyTitle}>No invoices here yet.</p>
          <Link href="/app" className={`${styles.primaryLink} ${fx.fx}`}>
            Record a job
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.key} className={styles.row}>
              <span className={styles.monogram} data-live={row.live} aria-hidden="true">
                {row.monogram}
              </span>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>
                  <span className={styles.rowName}>{row.customer}</span>
                  <span className={styles.rowBiz}>
                    {row.live ? (
                      <span className={styles.liveTag}>Live</span>
                    ) : (
                      `${row.business} · ${row.trade}`
                    )}
                  </span>
                </div>
                <span className={styles.rowSub}>{row.summary}</span>
                {row.said ? <span className={styles.rowSaid}>“{row.said}”</span> : null}
                {row.question ? <span className={styles.rowQuestion}>{row.question}</span> : null}
              </div>
              <div className={styles.rowSide}>
                <span className={styles.rowTotal}>{row.totalCents === null ? "—" : money(row.totalCents)}</span>
                <span className={styles.chip} data-tone={row.status.tone}>
                  {row.status.label}
                </span>
                <span className={styles.rowDate}>{row.live ? "Today" : shortDate(row.when)}</span>
                {row.payUrl ? (
                  <a className={styles.link} href={row.payUrl} target="_blank" rel="noreferrer">
                    Payment page
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
