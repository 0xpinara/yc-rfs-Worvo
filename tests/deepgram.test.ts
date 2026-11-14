import assert from "node:assert/strict";
import test from "node:test";
import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from "../src/shared/contracts";
import { assertAudioBounds } from "../src/server/capture/audio-bounds";
import { transcribeWithDeepgram } from "../src/server/capture/deepgram";

test("audio bounds reject empty, oversized, and too-long payloads", () => {
  assert.equal(assertAudioBounds({ byteLength: 0, durationSeconds: 1 }).ok, false);
  assert.equal(
    assertAudioBounds({ byteLength: MAX_AUDIO_BYTES + 1, durationSeconds: 1 }).ok,
    false,
  );
  assert.equal(
    assertAudioBounds({ byteLength: 100, durationSeconds: MAX_AUDIO_SECONDS + 1 }).ok,
    false,
  );
  assert.equal(assertAudioBounds({ byteLength: 100, durationSeconds: 5 }).ok, true);
});

test("Deepgram skips clearly when credentials are absent", async () => {
  const previous = process.env.DEEPGRAM_API_KEY;
  delete process.env.DEEPGRAM_API_KEY;
  try {
    const outcome = await transcribeWithDeepgram(
      {
        audio: new Uint8Array([1, 2, 3, 4]),
        mimeType: "audio/webm",
        durationSeconds: 2,
      },
      {
        apiKey: null,
        fetchFn: async () => {
          throw new Error("fetch must not run without credentials");
        },
      },
    );
    assert.equal(outcome.ok, false);
    if (!outcome.ok) {
      assert.equal(outcome.reason, "missing_credentials");
      assert.match(outcome.message, /DEEPGRAM_API_KEY/);
    }
  } finally {
    if (previous === undefined) delete process.env.DEEPGRAM_API_KEY;
    else process.env.DEEPGRAM_API_KEY = previous;
  }
});

test("Deepgram adapter posts binary audio with mip_opt_out and returns transcript", async () => {
  const calls: Array<{ url: string; headers: HeadersInit | undefined }> = [];

  const outcome = await transcribeWithDeepgram(
    {
      audio: new Uint8Array([9, 9, 9]),
      mimeType: "audio/webm",
      durationSeconds: 3,
    },
    {
      apiKey: "test-key-not-real",
      model: "nova-3",
      fetchFn: async (input, init) => {
        const url = String(input);
        calls.push({ url, headers: init?.headers });
        return new Response(
          JSON.stringify({
            metadata: { duration: 2.5 },
            results: {
              channels: [{ alternatives: [{ transcript: " Ninety minutes at Juniper. " }] }],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  );

  assert.equal(outcome.ok, true);
  if (outcome.ok) {
    assert.equal(outcome.data.transcript, "Ninety minutes at Juniper.");
    assert.equal(outcome.data.durationSeconds, 2.5);
  }
  assert.equal(calls.length, 1);
  assert.match(calls[0]?.url ?? "", /mip_opt_out=true/);
  assert.match(calls[0]?.url ?? "", /model=nova-3/);
  const headers = new Headers(calls[0]?.headers);
  assert.equal(headers.get("Authorization"), "Token test-key-not-real");
  assert.equal(headers.get("Content-Type"), "audio/webm");
});

test("Deepgram rejects oversize before calling the provider", async () => {
  const outcome = await transcribeWithDeepgram(
    {
      audio: new Uint8Array(MAX_AUDIO_BYTES + 1),
      mimeType: "audio/webm",
      durationSeconds: 1,
    },
    {
      apiKey: "test-key-not-real",
      fetchFn: async () => {
        throw new Error("must not fetch oversize audio");
      },
    },
  );
  assert.equal(outcome.ok, false);
  if (!outcome.ok) assert.equal(outcome.reason, "too_large");
});
