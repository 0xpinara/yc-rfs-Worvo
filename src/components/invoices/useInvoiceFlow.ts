"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Capture, DraftRequest, InvoiceView } from "@/shared/contracts";
import { createInvoiceDraft } from "@/lib/api/draft-client";
import { getInvoice, sendInvoice } from "@/lib/api/send-client";
import { createDraft } from "@/lib/api";

export type FlowPhase = "idle" | "drafting" | "draft" | "sending" | "sent" | "paid";

const POLL_MS = 1500;

/**
 * Demo flow driven by the companion UI / band:
 * draftFromCapture (or draftFromTranscript) → send on double-tap → poll until paid.
 * Uses Person A's capture/draft/send clients (idempotent keys on draft + send).
 */
export function useInvoiceFlow() {
  const [invoice, setInvoice] = useState<InvoiceView | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [busy, setBusy] = useState<"drafting" | "sending" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const invoiceRef = useRef<InvoiceView | null>(null);
  const busyRef = useRef(false);

  const apply = useCallback((next: InvoiceView | null) => {
    invoiceRef.current = next;
    setInvoice(next);
  }, []);

  const draftFromCapture = useCallback(
    async (capture: Capture) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy("drafting");
      setError(null);
      setTranscript(capture.transcript);
      apply(null);
      try {
        apply(await createInvoiceDraft(capture));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Draft failed.");
      } finally {
        busyRef.current = false;
        setBusy(null);
      }
    },
    [apply],
  );

  const draftFromTranscript = useCallback(
    async (text: string, source: DraftRequest["source"] = "typed_text", sourceId?: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy("drafting");
      setError(null);
      setTranscript(text);
      apply(null);
      const result = await createDraft({ transcript: text, source, ...(sourceId ? { sourceId } : {}) });
      busyRef.current = false;
      setBusy(null);
      if (result.ok) {
        apply(result.data.invoice);
      } else {
        setError(result.error.message);
      }
    },
    [apply],
  );

  const send = useCallback(async () => {
    const current = invoiceRef.current;
    if (busyRef.current || !current || current.unresolved.length > 0 || current.sendStatus === "succeeded") {
      return;
    }
    busyRef.current = true;
    setBusy("sending");
    setError(null);
    try {
      apply(await sendInvoice(current.id, current.revision));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }, [apply]);

  const reset = useCallback(() => {
    if (busyRef.current) return;
    apply(null);
    setTranscript(null);
    setError(null);
  }, [apply]);

  const waitingForPayment = invoice?.sendStatus === "succeeded" && invoice.paymentStatus !== "paid";
  const invoiceId = invoice?.id;
  useEffect(() => {
    if (!waitingForPayment || !invoiceId) return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const latest = await getInvoice(invoiceId);
          if (invoiceRef.current?.id === invoiceId) apply(latest);
        } catch {
          // keep polling
        }
      })();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [waitingForPayment, invoiceId, apply]);

  let phase: FlowPhase = "idle";
  if (busy) {
    phase = busy;
  } else if (invoice?.paymentStatus === "paid") {
    phase = "paid";
  } else if (invoice?.sendStatus === "succeeded") {
    phase = "sent";
  } else if (invoice) {
    phase = "draft";
  }

  return { phase, invoice, transcript, error, draftFromCapture, draftFromTranscript, send, reset };
}

export type InvoiceFlow = ReturnType<typeof useInvoiceFlow>;
