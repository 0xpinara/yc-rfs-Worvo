import { RevisionRequestSchema } from "@/shared/contracts";
import { InvoiceError } from "@/server/invoices/errors";
import { fail, ok } from "@/server/invoices/http";
import { invoiceStore } from "@/server/invoices/store";
import { stripeClient } from "@/server/stripe/client";
import { createAndSendStripeInvoice } from "@/server/stripe/invoices";

// Called on the band's double-tap after the read-back (or the companion Send button).
// Body: { expectedRevision } -> { invoice } with hostedInvoiceUrl set.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = RevisionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(new InvoiceError("invalid_input", "Expected { expectedRevision }"));
  }
  try {
    const stripe = stripeClient();
    const invoice = await invoiceStore().send(id, parsed.data.expectedRevision, (stored) =>
      createAndSendStripeInvoice(stripe, stored),
    );
    return ok({ invoice });
  } catch (error) {
    return fail(error);
  }
}
