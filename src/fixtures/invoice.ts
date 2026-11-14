import type { InvoiceView, Proposal } from "../shared/contracts";

export const DEMO_TRANSCRIPT = "Worvo, invoice Juniper Cafe for today's sink repair. Ninety minutes of labor at my usual rate and two shutoff valves at the standard price. Send it to their saved billing email.";

export const DEMO_PROPOSAL: Proposal = {
  customerReference: "Juniper Cafe",
  description: "Sink repair",
  serviceDate: null,
  laborMinutes: 90,
  materials: [{ reference: "shutoff valve", quantity: 2, evidence: "two shutoff valves at the standard price" }],
  laborEvidence: "Ninety minutes of labor at my usual rate",
  requestedIntent: "send_requested",
  unresolved: [],
};

// Synthetic review data only; .invalid is never a sendable recipient.
export const DEMO_INVOICE: InvoiceView = {
  id: "fixture-invoice-1",
  revision: 1,
  captureId: "fixture-capture-1",
  customerId: "fixture-juniper",
  customerName: "Juniper Cafe",
  recipient: "billing@juniper.invalid",
  currency: "usd",
  lines: [
    { description: "Sink repair labor", quantity: 90, unit: "minute", rateCents: 12000, rateUnit: "hour", amountCents: 18000 },
    { description: "Shutoff valves", quantity: 2, unit: "each", rateCents: 2250, rateUnit: "each", amountCents: 4500 },
  ],
  subtotalCents: 22500,
  totalCents: 22500,
  taxPolicy: "synthetic_no_tax",
  unresolved: [],
  authorizedRevision: null,
  stage: "draft",
  sendStatus: "not_requested",
  emailEventObserved: false,
  paymentStatus: "unpaid",
  paymentCollection: "unknown",
};
