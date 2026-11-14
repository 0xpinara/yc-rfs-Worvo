import { InvoiceError } from "@/server/invoices/errors";
import { fail, ok } from "@/server/invoices/http";
import { invoiceStore } from "@/server/invoices/store";

export const dynamic = "force-dynamic";

// Poll this for status: sendStatus, paymentStatus and hostedInvoiceUrl (for the QR code).
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const invoice = invoiceStore().get(id);
  return invoice ? ok({ invoice }) : fail(new InvoiceError("not_found", "No such invoice"));
}
