import type { ApiResult, Capture, DraftRequest, InvoiceView } from "@/shared/contracts";

/** Map a persisted Capture into B's DraftRequest (server rebuilds Capture for the invoice). */
export function draftRequestFromCapture(capture: Capture): DraftRequest {
  const source =
    capture.source === "vexo_memory" ? "typed_text"
    : capture.source === "fixture" ? "fixture"
    : capture.source;

  return {
    transcript: capture.transcript,
    source,
    sourceId: capture.sourceId,
    sessionId: capture.sessionId,
    capturedAt: capture.capturedAt,
  };
}

/** POST /api/invoices/draft — prices via A's extractProposal + B's catalog. */
export async function createInvoiceDraft(capture: Capture): Promise<InvoiceView> {
  const response = await fetch("/api/invoices/draft", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `draft-${capture.sourceId}`,
    },
    body: JSON.stringify(draftRequestFromCapture(capture)),
  });

  const body = await response.json() as ApiResult<{ invoice: InvoiceView }>;
  if (!body.ok) {
    throw new Error(body.error.message || `Draft failed (${response.status})`);
  }
  return body.data.invoice;
}
