import { createHash, randomUUID } from "node:crypto";
import { InvoiceViewSchema, type Capture, type DraftRequest, type InvoiceView, type Proposal } from "../../shared/contracts";
import type { Catalog } from "./catalog";
import { InvoiceError } from "./errors";
import { priceProposal } from "./pricing";

export type StoredInvoice = {
  view: InvoiceView;
  capture: Capture;
  proposal: Proposal;
  daysUntilDue: number;
};

export type SendResult = { hostedInvoiceUrl: string | null };
export type Extractor = (capture: Capture) => Promise<Proposal>;
export type Sender = (invoice: StoredInvoice) => Promise<SendResult>;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function captureFromRequest(request: DraftRequest, now: Date = new Date()): Capture {
  return {
    id: `cap_${randomUUID()}`,
    source: request.source,
    sourceId: request.sourceId ?? `adhoc_${randomUUID()}`,
    sessionId: request.sessionId ?? null,
    capturedAt: request.capturedAt ?? now.toISOString(),
    retrievedAt: now.toISOString(),
    contentHash: sha256(request.transcript),
    transcript: request.transcript,
  };
}

/**
 * Invoices live in server memory for the demo; Stripe holds the lasting record.
 * Sends are single-flight per invoice, so a second double-tap returns the first send's result.
 */
export function createInvoiceStore() {
  const invoices = new Map<string, StoredInvoice>();
  const draftsBySource = new Map<string, Promise<InvoiceView>>();
  const sendsInFlight = new Map<string, Promise<InvoiceView>>();
  const seenEvents = new Set<string>();

  function update(id: string, patch: Partial<InvoiceView>): InvoiceView {
    const stored = invoices.get(id)!;
    stored.view = InvoiceViewSchema.parse({ ...stored.view, ...patch });
    return stored.view;
  }

  async function createDraft(request: DraftRequest, extract: Extractor, catalog: Catalog): Promise<InvoiceView> {
    const capture = captureFromRequest(request);
    const proposal = await extract(capture);
    const view = InvoiceViewSchema.parse({
      id: `inv_${randomUUID().slice(0, 8)}`,
      revision: 1,
      captureId: capture.id,
      currency: catalog.currency,
      ...priceProposal(proposal, catalog),
      authorizedRevision: null,
      stage: "draft",
      sendStatus: "not_requested",
      emailEventObserved: false,
      paymentStatus: "unpaid",
      paymentCollection: "unknown",
      hostedInvoiceUrl: null,
    } satisfies InvoiceView);
    invoices.set(view.id, { view, capture, proposal, daysUntilDue: catalog.daysUntilDue });
    return view;
  }

  return {
    /** The same sourceId returns the same draft, so a retried capture never makes a second invoice. */
    draft(request: DraftRequest, extract: Extractor, catalog: Catalog): Promise<InvoiceView> {
      if (!request.sourceId) {
        return createDraft(request, extract, catalog);
      }
      const existing = draftsBySource.get(request.sourceId);
      if (existing) {
        return existing;
      }
      const pending = createDraft(request, extract, catalog);
      draftsBySource.set(request.sourceId, pending);
      pending.catch(() => draftsBySource.delete(request.sourceId!));
      return pending;
    },

    get(id: string): InvoiceView | null {
      return invoices.get(id)?.view ?? null;
    },

    list(): InvoiceView[] {
      return [...invoices.values()].map((stored) => stored.view).reverse();
    },

    send(id: string, expectedRevision: number, sender: Sender): Promise<InvoiceView> {
      const stored = invoices.get(id);
      if (!stored) {
        return Promise.reject(new InvoiceError("not_found", "No such invoice"));
      }
      if (stored.view.revision !== expectedRevision) {
        return Promise.reject(new InvoiceError("stale_revision", "The invoice changed; reload it before sending"));
      }
      if (stored.view.sendStatus === "succeeded") {
        return Promise.resolve(stored.view);
      }
      const inFlight = sendsInFlight.get(id);
      if (inFlight) {
        return inFlight;
      }
      if (stored.view.unresolved.length > 0) {
        return Promise.reject(
          new InvoiceError("unresolved_fields", "The invoice has open questions", stored.view.unresolved),
        );
      }

      update(id, { sendStatus: "pending", authorizedRevision: stored.view.revision });
      const sending = sender(stored)
        .then((result) =>
          update(id, { stage: "finalized", sendStatus: "succeeded", hostedInvoiceUrl: result.hostedInvoiceUrl }),
        )
        .catch((error: unknown) => {
          update(id, { sendStatus: "failed", authorizedRevision: null });
          throw error;
        })
        .finally(() => sendsInFlight.delete(id));
      sendsInFlight.set(id, sending);
      return sending;
    },

    /** Returns false for a Stripe event id already seen (Stripe retries and replays). */
    recordEvent(eventId: string): boolean {
      if (seenEvents.has(eventId)) {
        return false;
      }
      seenEvents.add(eventId);
      return true;
    },

    markPaid(id: string, collection: "stripe" | "out_of_band"): boolean {
      if (!invoices.has(id)) {
        return false;
      }
      update(id, { paymentStatus: "paid", paymentCollection: collection });
      return true;
    },

    markEmailEvent(id: string): boolean {
      if (!invoices.has(id)) {
        return false;
      }
      update(id, { emailEventObserved: true });
      return true;
    },
  };
}

export type InvoiceStore = ReturnType<typeof createInvoiceStore>;

// One store per server process; kept on globalThis so dev hot reloads don't wipe it.
const holder = globalThis as typeof globalThis & { __worvoInvoiceStore?: InvoiceStore };

export function invoiceStore(): InvoiceStore {
  holder.__worvoInvoiceStore ??= createInvoiceStore();
  return holder.__worvoInvoiceStore;
}
