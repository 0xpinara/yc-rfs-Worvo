import type { ApiResult, InvoiceView } from "@/shared/contracts";

/** POST /api/invoices/:id/send — Stripe sandbox invoice (requires empty unresolved). */
export async function sendInvoice(id: string, expectedRevision: number): Promise<InvoiceView> {
  const response = await fetch(`/api/invoices/${encodeURIComponent(id)}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `send-${id}-r${expectedRevision}`,
    },
    body: JSON.stringify({ expectedRevision }),
  });
  const body = await response.json() as ApiResult<{ invoice: InvoiceView }>;
  if (!body.ok) {
    throw new Error(body.error.message || `Send failed (${response.status})`);
  }
  return body.data.invoice;
}

export async function getInvoice(id: string): Promise<InvoiceView> {
  const response = await fetch(`/api/invoices/${encodeURIComponent(id)}`);
  const body = await response.json() as ApiResult<{ invoice: InvoiceView }>;
  if (!body.ok) {
    throw new Error(body.error.message || `Read failed (${response.status})`);
  }
  return body.data.invoice;
}
