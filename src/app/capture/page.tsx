"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Capture, InvoiceView } from "@/shared/contracts";
import { CaptureRecorder, BandCapture } from "@/components/capture";
import { createInvoiceDraft } from "@/lib/api/draft-client";
import { getInvoice, sendInvoice } from "@/lib/api/send-client";
import { transcribeBandRecording, transcribeBrowserMic } from "@/lib/api/captures-client";
import type { BandSession } from "@/lib/vexo/band-session";

/**
 * Demo path: band mic → draft → amber LED → double-tap send → QR → paid (green).
 * Companion Send button is the fallback when the band is not connected.
 */
export default function CapturePage() {
  const bandRef = useRef<BandSession | null>(null);
  const sendingRef = useRef(false);
  const [lastCapture, setLastCapture] = useState<Capture | null>(null);
  const [invoice, setInvoice] = useState<InvoiceView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [armHint, setArmHint] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "draft" | "armed" | "sent" | "paid">("idle");

  const onSession = useCallback((session: BandSession | null) => {
    bandRef.current = session;
  }, []);

  const disarm = useCallback(() => {
    bandRef.current?.onDoubleTap(null);
    setArmHint(null);
  }, []);

  const markPaid = useCallback(async (view: InvoiceView) => {
    setInvoice(view);
    setPhase("paid");
    disarm();
    await bandRef.current?.setStatusLed("paid_green");
  }, [disarm]);

  const runSend = useCallback(async (target: InvoiceView) => {
    if (sendingRef.current) return;
    if (target.unresolved.length > 0) {
      setError(`Cannot send: unresolved ${target.unresolved.join(", ")}`);
      await bandRef.current?.setStatusLed("blocked_red");
      return;
    }
    sendingRef.current = true;
    setBusy(true);
    setError(null);
    disarm();
    try {
      const sent = await sendInvoice(target.id, target.revision);
      setInvoice(sent);
      setPhase("sent");
      await bandRef.current?.setStatusLed("sent_blue");
      setArmHint("Sent. Open the hosted invoice / QR and pay with 4242…");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed.";
      setError(message);
      await bandRef.current?.setStatusLed("blocked_red");
      setPhase("draft");
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  }, [disarm]);

  const armSend = useCallback((view: InvoiceView) => {
    disarm();
    if (view.unresolved.length > 0) {
      setPhase("draft");
      setArmHint(`Draft has open questions — fix before send: ${view.unresolved.join(", ")}`);
      void bandRef.current?.setStatusLed("blocked_red");
      return;
    }
    setPhase("armed");
    setArmHint("Band LED amber: double-tap the band to send (or use Send below).");
    void bandRef.current?.setStatusLed("ready_amber");
    bandRef.current?.onDoubleTap(() => {
      void runSend(view);
    });
  }, [disarm, runSend]);

  const onCapture = useCallback(async (capture: Capture) => {
    setBusy(true);
    setError(null);
    setLastCapture(capture);
    setInvoice(null);
    setPhase("idle");
    disarm();
    try {
      const drafted = await createInvoiceDraft(capture);
      setInvoice(drafted);
      armSend(drafted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft failed.");
      await bandRef.current?.setStatusLed("blocked_red");
    } finally {
      setBusy(false);
    }
  }, [armSend, disarm]);

  // Poll payment after send while stripe listen is forwarding webhooks.
  useEffect(() => {
    if (phase !== "sent" || !invoice?.id) return;
    let cancelled = false;
    const id = invoice.id;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const latest = await getInvoice(id);
          if (cancelled) return;
          setInvoice(latest);
          if (latest.paymentStatus === "paid") {
            await markPaid(latest);
          }
        } catch {
          // keep polling
        }
      })();
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [invoice?.id, markPaid, phase]);

  useEffect(() => () => {
    disarm();
  }, [disarm]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <p><Link href="/">← Worvo</Link></p>
      <h1>Capture → draft → send</h1>
      <p>
        Speak the Juniper line on band 53. When the draft is clean, the band blinks <strong>amber</strong> —
        <strong> double-tap</strong> to create the Stripe sandbox invoice. After test payment, the band turns{" "}
        <strong>green</strong>. Keep <code>stripe listen</code> running for paid status.
      </p>

      <BandCapture
        allowSim
        busy={busy}
        error={error}
        armHint={armHint}
        onCapture={onCapture}
        onSession={onSession}
        transcribeAudio={transcribeBandRecording}
        onRecorderError={(e) => setError(e.message)}
      />

      <hr style={{ margin: "2rem 0" }} />

      <h2>Phone / browser mic</h2>
      <CaptureRecorder
        busy={busy}
        error={error}
        onCapture={onCapture}
        transcribeAudio={transcribeBrowserMic}
        onRecorderError={(e) => setError(e.message)}
      />

      {lastCapture ? (
        <section aria-label="Last capture" style={{ marginTop: "2rem" }}>
          <h2>Last capture</h2>
          <p>source: {lastCapture.source} · {lastCapture.sourceId}</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{lastCapture.transcript}</pre>
        </section>
      ) : null}

      {invoice ? (
        <section aria-label="Draft invoice" style={{ marginTop: "2rem" }}>
          <h2>
            {phase === "paid" ? "Paid" : phase === "sent" ? "Sent" : phase === "armed" ? "Ready to send" : "Draft"}{" "}
            invoice
          </h2>
          <p>
            {invoice.id} · rev {invoice.revision} · total ${(invoice.totalCents / 100).toFixed(2)}{" "}
            {invoice.currency.toUpperCase()}
          </p>
          <p>
            {invoice.customerName ?? "Unknown customer"}
            {invoice.recipient ? ` · ${invoice.recipient}` : ""}
          </p>
          <ul>
            {invoice.lines.map((line) => (
              <li key={`${line.description}-${line.quantity}`}>
                {line.description}: {line.quantity} × ${(line.rateCents / 100).toFixed(2)} = $
                {(line.amountCents / 100).toFixed(2)}
              </li>
            ))}
          </ul>
          {invoice.unresolved.length > 0 ? (
            <p role="status">Unresolved: {invoice.unresolved.join(", ")}</p>
          ) : null}
          <p>
            send: {invoice.sendStatus} · payment: {invoice.paymentStatus}
          </p>
          {invoice.hostedInvoiceUrl ? (
            <p>
              <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                Open hosted invoice
              </a>
              {" "}(pay with 4242…)
            </p>
          ) : null}
          {(phase === "armed" || phase === "draft") && invoice.unresolved.length === 0 ? (
            <button type="button" disabled={busy} onClick={() => void runSend(invoice)}>
              Send invoice (companion fallback)
            </button>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
