import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { CaptureSchema } from "../src/shared/contracts";
import { draftRequestFromCapture } from "../src/lib/api/draft-client";
import { DEMO_TRANSCRIPT } from "../src/fixtures/invoice";

test("draftRequestFromCapture maps capture fields for B's draft API", () => {
  const capture = CaptureSchema.parse({
    id: "cap-1",
    source: "vexo_ble",
    sourceId: "vexo-53-session",
    sessionId: "sess-1",
    capturedAt: "2026-11-14T20:00:00.000Z",
    retrievedAt: "2026-11-14T20:00:01.000Z",
    contentHash: createHash("sha256").update(DEMO_TRANSCRIPT).digest("hex"),
    transcript: DEMO_TRANSCRIPT,
  });
  const req = draftRequestFromCapture(capture);
  assert.equal(req.source, "vexo_ble");
  assert.equal(req.sourceId, "vexo-53-session");
  assert.equal(req.transcript, DEMO_TRANSCRIPT);
  assert.equal(req.sessionId, "sess-1");
});

test("draftRequestFromCapture maps vexo_memory to typed_text", () => {
  const capture = CaptureSchema.parse({
    id: "cap-2",
    source: "vexo_memory",
    sourceId: "mem-1",
    sessionId: null,
    capturedAt: "2026-11-14T20:00:00.000Z",
    retrievedAt: "2026-11-14T20:00:01.000Z",
    contentHash: createHash("sha256").update("hello").digest("hex"),
    transcript: "hello",
  });
  assert.equal(draftRequestFromCapture(capture).source, "typed_text");
});
