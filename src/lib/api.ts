import { InvoiceViewSchema, type ApiResult, type DraftRequest, type InvoiceView } from "@/shared/contracts";

type InvoiceResult = ApiResult<{ invoice: InvoiceView }>;

async function call(path: string, init?: RequestInit): Promise<InvoiceResult> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
      cache: "no-store",
    });
    const body = (await response.json()) as InvoiceResult;
    if (body.ok) {
      return { ok: true, data: { invoice: InvoiceViewSchema.parse(body.data.invoice) } };
    }
    return body;
  } catch {
    return { ok: false, error: { code: "provider_unavailable", message: "Can't reach the Worvo server" } };
  }
}

export function createDraft(request: DraftRequest): Promise<InvoiceResult> {
  return call("/api/invoices/draft", { method: "POST", body: JSON.stringify(request) });
}

export function sendInvoice(id: string, expectedRevision: number): Promise<InvoiceResult> {
  return call(`/api/invoices/${encodeURIComponent(id)}/send`, {
    method: "POST",
    body: JSON.stringify({ expectedRevision }),
  });
}

export function getInvoice(id: string): Promise<InvoiceResult> {
  return call(`/api/invoices/${encodeURIComponent(id)}`);
}
