import assert from "node:assert/strict";
import test from "node:test";
import { CaptureSchema } from "../src/shared/contracts";
import {
  fakeBusinessContext,
  handleTextCapture,
  handleTranscribeCapture,
  resetCaptureStore,
  resetRequireBusinessContext,
  setRequireBusinessContext,
} from "../src/server/capture";
import { DEMO_TRANSCRIPT } from "../src/fixtures/invoice";

test.beforeEach(() => {
  delete process.env.DEMO_MODE;
  delete process.env.DEMO_IDENTITY_ENABLED;
  resetRequireBusinessContext();
  resetCaptureStore();
});

test.afterEach(() => {
  delete process.env.DEMO_MODE;
  delete process.env.DEMO_IDENTITY_ENABLED;
  resetRequireBusinessContext();
  resetCaptureStore();
});

test("text capture rejects unauthenticated callers", async () => {
  const result = await handleTextCapture({
    transcript: DEMO_TRANSCRIPT,
    sourceId: "typed-1",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "unauthenticated");
});

test("demo identity allows text capture when both DEMO flags are set", async () => {
  process.env.DEMO_MODE = "true";
  process.env.DEMO_IDENTITY_ENABLED = "true";
  resetRequireBusinessContext();
  const result = await handleTextCapture({
    transcript: DEMO_TRANSCRIPT,
    sourceId: "demo-typed-1",
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.capture.source, "typed_text");
});

test("text capture rejects client businessId authority", async () => {
  setRequireBusinessContext(async () => ({ ok: true, context: fakeBusinessContext() }));
  const result = await handleTextCapture({
    transcript: DEMO_TRANSCRIPT,
    sourceId: "typed-1",
    businessId: "evil",
  } as never);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "invalid_input");
});

test("text capture persists attributable capture with fake context", async () => {
  setRequireBusinessContext(async () => ({ ok: true, context: fakeBusinessContext() }));
  const first = await handleTextCapture({
    transcript: DEMO_TRANSCRIPT,
    sourceId: "typed-stable-1",
    capturedAt: "2026-11-14T18:00:00.000Z",
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  CaptureSchema.parse(first.data.capture);
  assert.equal(first.data.capture.source, "typed_text");
  assert.equal(first.data.capture.sourceId, "typed-stable-1");
  assert.equal(first.data.capture.capturedAt, "2026-11-14T18:00:00.000Z");
  assert.match(first.data.capture.contentHash, /^[a-f0-9]{64}$/);

  const second = await handleTextCapture({
    transcript: DEMO_TRANSCRIPT,
    sourceId: "typed-stable-1",
    capturedAt: "2026-11-14T18:05:00.000Z",
  });
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.data.capture.id, first.data.capture.id);
});

test("transcribe capture maps missing Deepgram credentials to provider_unavailable", async () => {
  setRequireBusinessContext(async () => ({ ok: true, context: fakeBusinessContext() }));
  const previous = process.env.DEEPGRAM_API_KEY;
  delete process.env.DEEPGRAM_API_KEY;
  try {
    const result = await handleTranscribeCapture({
      audio: new Uint8Array([1, 2, 3, 4]),
      mimeType: "audio/webm",
      durationSeconds: 1,
      sourceId: "mic-1",
      source: "browser_mic",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "provider_unavailable");
  } finally {
    if (previous === undefined) delete process.env.DEEPGRAM_API_KEY;
    else process.env.DEEPGRAM_API_KEY = previous;
  }
});

test("transcribe rejects WebM label for vexo_ble Opus", async () => {
  setRequireBusinessContext(async () => ({ ok: true, context: fakeBusinessContext() }));
  const result = await handleTranscribeCapture({
    audio: new Uint8Array([1, 2, 3, 4]),
    mimeType: "audio/webm",
    durationSeconds: 1,
    sourceId: "ble-1",
    source: "vexo_ble",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "invalid_input");
});
