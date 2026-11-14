import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { DEMO_INVOICE, DEMO_PROPOSAL, DEMO_TRANSCRIPT } from "../src/fixtures/invoice";
import type { Proposal } from "../src/shared/contracts";
import { demoCatalog } from "../src/server/invoices/catalog";
import { laborCents, priceProposal } from "../src/server/invoices/pricing";
import { createInvoiceStore } from "../src/server/invoices/store";
import { createAndSendStripeInvoice, type StripeInvoicing } from "../src/server/stripe/invoices";
import { handleStripeWebhook } from "../src/server/stripe/webhook";

const catalog = demoCatalog({ INVOICE_TEST_RECIPIENT: "billing@juniper-cafe.example.com" });
const extractDemo = async (): Promise<Proposal> => DEMO_PROPOSAL;
const demoRequest = { transcript: DEMO_TRANSCRIPT, source: "typed_text" as const };

/** Records calls; `totalOverride` simulates Stripe computing a different total than ours. */
function fakeStripe(totalOverride?: number) {
  const calls: string[] = [];
  let itemsTotal = 0;
  const invoice = (status: string) => ({
    id: "in_test_1", status, total: totalOverride ?? itemsTotal,
    hosted_invoice_url: status === "draft" ? null : "https://invoice.stripe.com/i/test_1",
  });
  const fake = {
    customers: {
      list: async () => { calls.push("customers.list"); return { data: [] }; },
      create: async () => { calls.push("customers.create"); return { id: "cus_test_1" }; },
    },
    invoices: {
      create: async () => { calls.push("invoices.create"); return invoice("draft"); },
      retrieve: async () => { calls.push("invoices.retrieve"); return invoice("draft"); },
      finalizeInvoice: async () => { calls.push("invoices.finalize"); return invoice("open"); },
      sendInvoice: async () => { calls.push("invoices.send"); return invoice("open"); },
    },
    invoiceItems: {
      create: async (params: { amount: number }) => { calls.push("invoiceItems.create"); itemsTotal += params.amount; return {}; },
    },
  };
  return { stripe: fake as unknown as StripeInvoicing, calls };
}

test("the server prices the canonical proposal from the catalog: $180 labor + $45 valves = $225", () => {
  const priced = priceProposal(DEMO_PROPOSAL, catalog);
  assert.deepEqual(priced.lines, DEMO_INVOICE.lines);
  assert.equal(priced.totalCents, 22500);
  assert.equal(priced.customerId, "juniper-cafe");
  assert.deepEqual(priced.unresolved, []);
});

test("labor rounds half-up once to whole cents", () => {
  assert.equal(laborCents(90, 12000), 18000);
  assert.equal(laborCents(10, 3), 1); // 0.5 cent rounds up
  assert.equal(laborCents(7, 12500), 1458); // 1458.33 rounds down
});

test("unknown customer, missing recipient or unknown part leaves a draft that cannot be sent", async () => {
  const priced = priceProposal(
    { ...DEMO_PROPOSAL, customerReference: "Blue Door Bakery", materials: [{ reference: "flux capacitor", quantity: 1, evidence: "x" }] },
    catalog,
  );
  assert.deepEqual(priced.unresolved.sort(), ["customer", "price:flux capacitor"]);
  assert.deepEqual(priceProposal(DEMO_PROPOSAL, demoCatalog({})).unresolved, ["recipient"]);

  const store = createInvoiceStore();
  const draft = await store.draft(demoRequest, extractDemo, demoCatalog({}));
  const { stripe, calls } = fakeStripe();
  await assert.rejects(store.send(draft.id, 1, (stored) => createAndSendStripeInvoice(stripe, stored)), { code: "unresolved_fields" });
  await assert.rejects(store.send(draft.id, 2, (stored) => createAndSendStripeInvoice(stripe, stored)), { code: "stale_revision" });
  assert.deepEqual(calls, []);
});

test("a retried capture makes one draft, and two double-taps make one Stripe invoice", async () => {
  const store = createInvoiceStore();
  const [first, retry] = await Promise.all([
    store.draft({ ...demoRequest, sourceId: "band-53-take-1" }, extractDemo, catalog),
    store.draft({ ...demoRequest, sourceId: "band-53-take-1" }, extractDemo, catalog),
  ]);
  assert.equal(first.id, retry.id);
  assert.equal(store.list().length, 1);

  const { stripe, calls } = fakeStripe();
  const send = () => store.send(first.id, 1, (stored) => createAndSendStripeInvoice(stripe, stored));
  const [a, b] = await Promise.all([send(), send()]);
  assert.equal(calls.filter((call) => call === "invoices.create").length, 1);
  assert.equal(calls.filter((call) => call === "invoiceItems.create").length, 2);
  assert.equal(a.sendStatus, "succeeded");
  assert.equal(b.hostedInvoiceUrl, "https://invoice.stripe.com/i/test_1");
  assert.equal((await send()).id, first.id);
  assert.equal(calls.filter((call) => call === "invoices.send").length, 1);
});

test("a Stripe total that differs from ours stops the invoice before it is finalized", async () => {
  const store = createInvoiceStore();
  const draft = await store.draft(demoRequest, extractDemo, catalog);
  const { stripe, calls } = fakeStripe(99999);
  await assert.rejects(store.send(draft.id, 1, (stored) => createAndSendStripeInvoice(stripe, stored)), /does not match/);
  assert.equal(calls.includes("invoices.finalize"), false);
  assert.equal(store.get(draft.id)?.sendStatus, "failed");
});

test("only a correctly signed invoice.paid marks the invoice paid, once", async () => {
  const store = createInvoiceStore();
  const draft = await store.draft(demoRequest, extractDemo, catalog);
  const stripe = new Stripe("sk_test_not_used_for_requests");
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({
    id: "evt_test_1", object: "event", type: "invoice.paid", livemode: false,
    data: { object: { object: "invoice", amount_paid: 22500, metadata: { worvo_invoice_id: draft.id } } },
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });

  assert.throws(() => handleStripeWebhook(stripe, store, payload, signature, "whsec_wrong"));
  assert.equal(store.get(draft.id)?.paymentStatus, "unpaid");
  assert.equal(handleStripeWebhook(stripe, store, payload, signature, secret), "applied");
  assert.equal(handleStripeWebhook(stripe, store, payload, signature, secret), "duplicate");
  assert.equal(store.get(draft.id)?.paymentStatus, "paid");
  assert.equal(store.get(draft.id)?.paymentCollection, "stripe");
});
