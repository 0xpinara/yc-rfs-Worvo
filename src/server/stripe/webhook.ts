import type Stripe from "stripe";
import type { InvoiceStore } from "../invoices/store";

export type WebhookOutcome = "applied" | "duplicate" | "ignored";

/**
 * Verifies the signature on the raw body (throws if it is wrong), skips replays,
 * and applies the two invoice events the demo needs. Only invoice.paid marks an invoice paid.
 */
export function handleStripeWebhook(
  stripe: Pick<Stripe, "webhooks">,
  store: InvoiceStore,
  rawBody: string,
  signature: string,
  secret: string,
): WebhookOutcome {
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  if (event.livemode) {
    return "ignored";
  }
  if (!store.recordEvent(event.id)) {
    return "duplicate";
  }

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object;
      const id = invoice.metadata?.worvo_invoice_id;
      const collection = invoice.amount_paid > 0 ? "stripe" : "out_of_band";
      return id && store.markPaid(id, collection) ? "applied" : "ignored";
    }
    case "invoice.sent": {
      const id = event.data.object.metadata?.worvo_invoice_id;
      return id && store.markEmailEvent(id) ? "applied" : "ignored";
    }
    default:
      return "ignored";
  }
}
