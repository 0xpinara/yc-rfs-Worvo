import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { CaptureSchema, InvoiceViewSchema, ProposalSchema, RevisionRequestSchema } from "../src/shared/contracts";
import { DEMO_INVOICE, DEMO_PROPOSAL, DEMO_TRANSCRIPT } from "../src/fixtures/invoice";

test("all workstreams share the same valid synthetic $225 invoice", () => {
  const invoice = InvoiceViewSchema.parse(DEMO_INVOICE);
  assert.equal(ProposalSchema.parse(DEMO_PROPOSAL).requestedIntent, "send_requested");
  assert.equal(invoice.lines.reduce((sum, line) => sum + line.amountCents, 0), 22500);
  assert.equal(invoice.totalCents, 22500);
  assert.equal(invoice.authorizedRevision, null);
  assert.equal(invoice.sendStatus, "not_requested");
});

test("captures retain source timing and identity; blank transcripts fail", () => {
  const capture = {
    id: DEMO_INVOICE.captureId, source: "fixture", sourceId: "canonical-utterance-v1",
    sessionId: null, capturedAt: "2026-11-14T20:00:00Z", retrievedAt: "2026-11-14T20:00:01Z",
    contentHash: createHash("sha256").update(DEMO_TRANSCRIPT).digest("hex"), transcript: DEMO_TRANSCRIPT,
  };
  assert.equal(CaptureSchema.parse(capture).source, "fixture");
  assert.equal(CaptureSchema.safeParse({ ...capture, transcript: " " }).success, false);
});

test("approval requests reject client authority fields and invalid revisions", () => {
  assert.deepEqual(RevisionRequestSchema.parse({ expectedRevision: 1 }), { expectedRevision: 1 });
  for (const field of ["businessId", "actorId", "recipient", "totalCents", "approved"]) {
    assert.equal(RevisionRequestSchema.safeParse({ expectedRevision: 1, [field]: "untrusted" }).success, false);
  }
  assert.equal(RevisionRequestSchema.safeParse({ expectedRevision: 0 }).success, false);
});

test("wire schemas reject fractional money and unknown lifecycle facts", () => {
  assert.equal(InvoiceViewSchema.safeParse({ ...DEMO_INVOICE, totalCents: 22500.5 }).success, false);
  assert.equal(InvoiceViewSchema.safeParse({ ...DEMO_INVOICE, sendStatus: "delivered" }).success, false);
  assert.equal(ProposalSchema.safeParse({ ...DEMO_PROPOSAL, approved: true }).success, false);
});
