"use client";

import { useState, type FormEvent } from "react";
import type { InvoiceView } from "@/shared/contracts";
import { DEMO_TRANSCRIPT } from "@/fixtures/invoice";
import { QrCode } from "./QrCode";
import { useInvoiceFlow, type FlowPhase } from "./useInvoiceFlow";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money = (cents: number) => usd.format(cents / 100);

function steps(phase: FlowPhase, invoice: InvoiceView | null): { label: string; done: boolean }[] {
  return [
    { label: "Heard", done: phase !== "idle" },
    { label: "Priced", done: invoice !== null && invoice.unresolved.length === 0 },
    { label: "Sent", done: phase === "sent" || phase === "paid" },
    { label: "Paid", done: phase === "paid" },
  ];
}

const QUESTION: Record<string, string> = {
  customer: "Which customer is this for?",
  recipient: "The customer's billing email",
  labor: "How long the job took",
  labor_minutes: "How long the job took",
  labor_rate: "Which labor rate to use",
  materials: "Which parts were used, and how many",
  parts_amount: "Which parts were used, and how many",
  material_quantity: "How many of each part",
  material_price: "The price of each part",
  lines: "What to bill for",
};

function question(field: string): string {
  if (field.startsWith("price:")) {
    return `A saved price for “${field.slice("price:".length)}”`;
  }
  return QUESTION[field] ?? field;
}

function lineDetail(line: InvoiceView["lines"][number]): string {
  return line.unit === "minute"
    ? `${line.quantity} min at ${money(line.rateCents)}/hr`
    : `${line.quantity} at ${money(line.rateCents)} each`;
}

function HeardPanel({ transcript, phase, onSubmit }: {
  transcript: string | null;
  phase: FlowPhase;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState(DEMO_TRANSCRIPT);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <section className="panel" aria-labelledby="heard-title">
      <h2 id="heard-title">What the plumber said</h2>
      {transcript ? (
        <blockquote className="transcript">“{transcript}”</blockquote>
      ) : (
        <>
          <p className="waiting"><span className="pulse" aria-hidden="true" /> Listening on the band…</p>
          <form className="typed" onSubmit={submit}>
            <label htmlFor="typed-transcript">Or type it</label>
            <textarea
              id="typed-transcript"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={5}
            />
            <button type="submit" className="button secondary" disabled={phase !== "idle"}>
              Create invoice
            </button>
          </form>
        </>
      )}
    </section>
  );
}

function InvoicePanel({ invoice, phase }: { invoice: InvoiceView | null; phase: FlowPhase }) {
  return (
    <section className="panel" aria-labelledby="invoice-title">
      <h2 id="invoice-title">Invoice</h2>
      {!invoice ? (
        <p className="muted">{phase === "drafting" ? "Pricing it from your saved rates…" : "Nothing yet."}</p>
      ) : (
        <>
          <p className="bill-to">
            <span className="muted">Bill to</span>
            <strong>{invoice.customerName ?? "Unknown customer"}</strong>
          </p>
          {invoice.lines.length > 0 && (
            <table className="lines">
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.description}>
                    <td>
                      <span className="line-name">{line.description}</span>
                      <span className="muted">{lineDetail(line)}</span>
                    </td>
                    <td className="amount">{money(line.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="amount">{money(invoice.totalCents)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          {invoice.unresolved.length > 0 ? (
            <div className="questions">
              <p>Needs an answer before it can be sent:</p>
              <ul>
                {[...new Set(invoice.unresolved.map(question))].map((text) => <li key={text}>{text}</li>)}
              </ul>
            </div>
          ) : (
            <p className="caption">Priced from the plumber&apos;s saved rates. The AI never sets a price.</p>
          )}
        </>
      )}
    </section>
  );
}

function PayPanel({ invoice, phase, onSend }: { invoice: InvoiceView | null; phase: FlowPhase; onSend: () => void }) {
  const ready = invoice !== null && invoice.unresolved.length === 0;
  return (
    <section className={`panel pay pay-${phase}`} aria-labelledby="pay-title">
      <h2 id="pay-title">Send and get paid</h2>
      {phase === "paid" && invoice ? (
        <div className="paid">
          <div className="check" aria-hidden="true">✓</div>
          <p className="paid-title">Paid</p>
          <p className="muted">{money(invoice.totalCents)} received through Stripe</p>
        </div>
      ) : phase === "sent" && invoice?.hostedInvoiceUrl ? (
        <div className="scan">
          <QrCode value={invoice.hostedInvoiceUrl} label={`QR code to pay ${money(invoice.totalCents)}`} />
          <p className="scan-title">Scan to pay {money(invoice.totalCents)}</p>
          <p className="waiting"><span className="pulse" aria-hidden="true" /> Waiting for payment…</p>
          <a className="link" href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">Open the payment page</a>
        </div>
      ) : phase === "sending" ? (
        <p className="big-prompt">Sending through Stripe…</p>
      ) : ready ? (
        <>
          <p className="big-prompt">Double-tap the band to send</p>
          <button type="button" className="button" onClick={onSend}>Send invoice</button>
        </>
      ) : invoice ? (
        <p className="muted">Answer the questions to send it.</p>
      ) : (
        <p className="muted">The invoice appears here once it&apos;s priced.</p>
      )}
    </section>
  );
}

export function InvoiceScreen() {
  const flow = useInvoiceFlow();
  const { phase, invoice, transcript, error } = flow;

  return (
    <main className="screen">
      <header className="top">
        <div>
          <h1>Worvo</h1>
          <p className="tagline">Say it. Send the invoice.</p>
        </div>
        <ol className="steps" aria-label="Progress">
          {steps(phase, invoice).map((step) => (
            <li key={step.label} className={step.done ? "done" : undefined}>{step.label}</li>
          ))}
        </ol>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="grid" aria-live="polite">
        <HeardPanel transcript={transcript} phase={phase} onSubmit={(text) => flow.draftFromTranscript(text)} />
        <InvoicePanel invoice={invoice} phase={phase} />
        <PayPanel invoice={invoice} phase={phase} onSend={flow.send} />
      </div>

      <footer className="bottom">
        <span className="badge">Stripe test mode</span>
        {(invoice || error) && (
          <button type="button" className="button ghost" onClick={flow.reset} disabled={phase === "drafting" || phase === "sending"}>
            New invoice
          </button>
        )}
      </footer>
    </main>
  );
}
