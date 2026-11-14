"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DraftRequest, InvoiceView } from "@/shared/contracts";
import { createDraft, getInvoice, sendInvoice } from "@/lib/api";

export type FlowPhase = "idle" | "drafting" | "draft" | "sending" | "sent" | "paid";

const POLL_MS = 1500;

/**
 * The whole demo flow in one place, so the band code can drive it:
 * call draftFromTranscript() when a capture finishes, send() on the double-tap,
 * and turn the light green when phase becomes "paid".
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

  const draftFromTranscript = useCallback(
    async (text: string, source: DraftRequest["source"] = "typed_text", sourceId?: string) => {
      if (busyRef.current) {
        return;
      }
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
    const result = await sendInvoice(current.id, current.revision);
    busyRef.current = false;
    setBusy(null);
    if (result.ok) {
      apply(result.data.invoice);
    } else {
      setError(result.error.message);
    }
  }, [apply]);

  const reset = useCallback(() => {
    if (busyRef.current) {
      return;
    }
    apply(null);
    setTranscript(null);
    setError(null);
  }, [apply]);

  const waitingForPayment = invoice?.sendStatus === "succeeded" && invoice.paymentStatus !== "paid";
  const invoiceId = invoice?.id;
  useEffect(() => {
    if (!waitingForPayment || !invoiceId) {
      return;
    }
    const timer = setInterval(async () => {
      const result = await getInvoice(invoiceId);
      if (result.ok && invoiceRef.current?.id === invoiceId) {
        apply(result.data.invoice);
      }
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

  return { phase, invoice, transcript, error, draftFromTranscript, send, reset };
}

export type InvoiceFlow = ReturnType<typeof useInvoiceFlow>;
