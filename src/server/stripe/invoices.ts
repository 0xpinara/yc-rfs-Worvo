import { createHash } from "node:crypto";
import type Stripe from "stripe";
import type { InvoiceView } from "../../shared/contracts";
import { InvoiceError } from "../invoices/errors";
import type { SendResult, StoredInvoice } from "../invoices/store";

export type StripeInvoicing = Pick<Stripe, "customers" | "invoices" | "invoiceItems">;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function lineDescription(line: InvoiceView["lines"][number]): string {
  const rate = usd.format(line.rateCents / 100);
  return line.unit === "minute"
    ? `${line.description}: ${line.quantity} min at ${rate}/hr`
    : `${line.description}: ${line.quantity} at ${rate} each`;
}

async function findOrCreateCustomer(
  stripe: StripeInvoicing,
  customer: { id: string; name: string; email: string },
): Promise<string> {
  const existing = await stripe.customers.list({ email: customer.email, limit: 10 });
  const match = existing.data.find((candidate) => candidate.metadata?.worvo_customer_id === customer.id);
  if (match) {
    return match.id;
  }
  const emailHash = createHash("sha256").update(customer.email).digest("hex").slice(0, 16);
  const created = await stripe.customers.create(
    { name: customer.name, email: customer.email, metadata: { worvo_customer_id: customer.id } },
    { idempotencyKey: `worvo-customer-${customer.id}-${emailHash}` },
  );
  return created.id;
}

/**
 * Creates one Stripe invoice from the server-priced draft, checks Stripe's total against ours,
 * then finalizes and sends it. Every step has a stable idempotency key, so a retry after a
 * failure resumes the same Stripe invoice instead of making a second one.
 */
export async function createAndSendStripeInvoice(stripe: StripeInvoicing, stored: StoredInvoice): Promise<SendResult> {
  const { view } = stored;
  if (!view.customerId || !view.customerName || !view.recipient) {
    throw new InvoiceError("unresolved_fields", "The invoice has no saved customer and recipient", ["customer", "recipient"]);
  }
  const key = (step: string) => `worvo-${view.id}-r${view.revision}-${step}`;
  const metadata = { worvo_invoice_id: view.id, worvo_revision: String(view.revision) };

  const customerId = await findOrCreateCustomer(stripe, {
    id: view.customerId,
    name: view.customerName,
    email: view.recipient,
  });

  const draft = await stripe.invoices.create(
    {
      customer: customerId,
      currency: view.currency,
      collection_method: "send_invoice",
      days_until_due: stored.daysUntilDue,
      auto_advance: false,
      pending_invoice_items_behavior: "exclude",
      description: stored.proposal.description,
      metadata,
    },
    { idempotencyKey: key("invoice") },
  );

  for (const [index, line] of view.lines.entries()) {
    await stripe.invoiceItems.create(
      {
        customer: customerId,
        invoice: draft.id,
        currency: view.currency,
        amount: line.amountCents,
        description: lineDescription(line),
        metadata,
      },
      { idempotencyKey: key(`line-${index}`) },
    );
  }

  const current = await stripe.invoices.retrieve(draft.id);
  if (current.total !== view.totalCents) {
    throw new InvoiceError(
      "provider_unavailable",
      `Stripe's total (${current.total} cents) does not match Worvo's (${view.totalCents} cents); not sending`,
    );
  }

  const finalized = current.status === "draft"
    ? await stripe.invoices.finalizeInvoice(draft.id, { auto_advance: false }, { idempotencyKey: key("finalize") })
    : current;
  const sent = await stripe.invoices.sendInvoice(finalized.id, {}, { idempotencyKey: key("send") });

  return { hostedInvoiceUrl: sent.hosted_invoice_url ?? finalized.hosted_invoice_url ?? null };
}
