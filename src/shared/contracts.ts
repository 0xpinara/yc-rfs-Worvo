import { z } from "zod";

export const BAND_NUMBER = 53;
export const MAX_AUDIO_SECONDS = 60;
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

// Shape validation is not authentication, pricing, deduplication, or authorization.
export const CaptureSchema = z.strictObject({
  id: z.string().min(1),
  source: z.enum(["fixture", "typed_text", "browser_mic", "vexo_ble", "vexo_memory"]),
  sourceId: z.string().min(1),
  sessionId: z.string().min(1).nullable(),
  capturedAt: z.iso.datetime(),
  retrievedAt: z.iso.datetime(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  transcript: z.string().trim().min(1).max(10000),
});

export const ProposalSchema = z.strictObject({
  customerReference: z.string().min(1).nullable(),
  description: z.string().min(1),
  serviceDate: z.iso.date().nullable(),
  laborMinutes: z.number().int().positive().nullable(),
  materials: z.array(z.strictObject({
    reference: z.string().min(1),
    quantity: z.number().int().positive(),
    evidence: z.string().min(1),
  })),
  laborEvidence: z.string().min(1).nullable(),
  requestedIntent: z.enum(["draft", "send_requested"]),
  unresolved: z.array(z.string().min(1)),
});

const Cents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const InvoiceViewSchema = z.strictObject({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  captureId: z.string().min(1),
  customerId: z.string().min(1).nullable(),
  customerName: z.string().min(1).nullable(),
  recipient: z.email().nullable(),
  currency: z.literal("usd"),
  lines: z.array(z.strictObject({
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unit: z.enum(["minute", "each"]),
    rateCents: Cents,
    rateUnit: z.enum(["hour", "each"]),
    amountCents: Cents,
  })),
  subtotalCents: Cents,
  totalCents: Cents,
  taxPolicy: z.enum(["unresolved", "synthetic_no_tax", "configured"]),
  unresolved: z.array(z.string().min(1)),
  authorizedRevision: z.number().int().positive().nullable(),
  stage: z.enum(["draft", "finalized"]),
  sendStatus: z.enum(["not_requested", "pending", "unknown", "succeeded", "failed"]),
  emailEventObserved: z.boolean(),
  paymentStatus: z.enum(["unpaid", "paid"]),
  paymentCollection: z.enum(["unknown", "stripe", "out_of_band"]),
  // Stripe's hosted invoice page: the customer pays here (shown as a QR code in the demo).
  hostedInvoiceUrl: z.url().nullable(),
});

// What a caller sends to create a draft. The server builds the Capture (id, hash, times).
// Reuse the same sourceId on a retry and the server returns the same draft.
export const DraftRequestSchema = z.strictObject({
  transcript: z.string().trim().min(1).max(10000),
  source: z.enum(["fixture", "typed_text", "browser_mic", "vexo_ble"]),
  sourceId: z.string().min(1).max(200).optional(),
  sessionId: z.string().min(1).max(200).nullable().optional(),
  capturedAt: z.iso.datetime().optional(),
});

// Actor/business/recipient/totals are deliberately absent: the server loads them.
export const RevisionRequestSchema = z.strictObject({
  expectedRevision: z.number().int().positive(),
});

export type Capture = z.infer<typeof CaptureSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type InvoiceView = z.infer<typeof InvoiceViewSchema>;
export type DraftRequest = z.infer<typeof DraftRequestSchema>;

export type ApiErrorCode =
  | "unauthenticated" | "forbidden" | "not_found" | "invalid_input"
  | "unresolved_fields" | "stale_revision" | "duplicate_visit"
  | "send_locked" | "send_unknown" | "idempotency_conflict" | "provider_unavailable";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string; fields?: string[] } };
