import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import {
  createRecorderController,
  mapMediaError,
  type MediaRecorderLike,
  type MediaStreamLike,
  type RecorderControllerDeps,
} from "../src/components/capture/recorder-controller";
import type { CaptureRecorderError, RecorderAudioInput } from "../src/components/capture/types";
import type { Capture } from "../src/shared/contracts";
import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from "../src/shared/contracts";

class FakeTrack {
  stopped = false;
  stop() {
    this.stopped = true;
  }
}

class FakeRecorder implements MediaRecorderLike {
  state: "inactive" | "recording" | "paused" = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onerror: ((event: { error?: { name?: string; message?: string } }) => void) | null = null;
  onstop: (() => void) | null = null;
  private chunkSize: number;

  constructor(chunkSize = 2048) {
    this.chunkSize = chunkSize;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array(this.chunkSize)], { type: this.mimeType }) });
    this.onstop?.();
  }
}

function makeDeps(overrides: Partial<RecorderControllerDeps> & {
  chunkSize?: number;
  failGetUserMedia?: unknown;
} = {}): { deps: RecorderControllerDeps; tracks: FakeTrack[]; recorder: FakeRecorder } {
  const tracks = [new FakeTrack(), new FakeTrack()];
  const recorder = new FakeRecorder(overrides.chunkSize ?? 2048);
  const clock = 1_700_000_000_000;

  const deps: RecorderControllerDeps = {
    getUserMedia: async () => {
      if (overrides.failGetUserMedia) throw overrides.failGetUserMedia;
      const stream: MediaStreamLike = { getTracks: () => tracks };
      return stream;
    },
    createRecorder: () => recorder,
    now: () => clock,
    minDurationSeconds: 0.4,
    minByteLength: 256,
    ...overrides,
  };

  return { deps, tracks, recorder };
}

test("mapMediaError classifies permission denial", () => {
  const err = mapMediaError({ name: "NotAllowedError", message: "Permission denied" });
  assert.equal(err.code, "permission_denied");
});

test("start then stop yields bounded browser_mic audio and stops tracks", async () => {
  const { deps, tracks } = makeDeps();
  let clock = 1_700_000_000_000;
  deps.now = () => clock;

  const controller = createRecorderController(deps);
  await controller.start();
  assert.equal(controller.isRecording(), true);
  clock += 2500;
  assert.ok(controller.getElapsedSeconds() >= 2.4);

  const audio = await controller.stop();
  assert.equal(audio.source, "browser_mic");
  assert.equal(audio.mimeType, "audio/webm");
  assert.ok(audio.byteLength >= 256);
  assert.ok(audio.durationSeconds >= 2);
  assert.ok(audio.durationSeconds <= MAX_AUDIO_SECONDS);
  assert.ok(tracks.every((t) => t.stopped));
  assert.equal(controller.isRecording(), false);
});

test("silence (tiny blob) rejects without inventing audio", async () => {
  const { deps } = makeDeps({ chunkSize: 8, minByteLength: 256 });
  let clock = 0;
  deps.now = () => clock;
  const controller = createRecorderController(deps);
  await controller.start();
  clock += 2000;
  await assert.rejects(
    () => controller.stop(),
    (err: unknown) => {
      assert.equal((err as CaptureRecorderError).code, "silence");
      return true;
    },
  );
});

test("permission denial on start maps to permission_denied", async () => {
  const { deps } = makeDeps({
    failGetUserMedia: Object.assign(new Error("Permission denied"), { name: "NotAllowedError" }),
  });
  const controller = createRecorderController(deps);
  await assert.rejects(
    () => controller.start(),
    (err: unknown) => {
      assert.equal((err as CaptureRecorderError).code, "permission_denied");
      return true;
    },
  );
});

test("dispose during recording stops tracks and clears state", async () => {
  const { deps, tracks } = makeDeps();
  const controller = createRecorderController(deps);
  await controller.start();
  controller.dispose();
  assert.equal(controller.isRecording(), false);
  assert.ok(tracks.every((t) => t.stopped));
  await assert.rejects(() => controller.stop());
});

test("oversized blob is rejected against MAX_AUDIO_BYTES", async () => {
  const { deps } = makeDeps({
    chunkSize: 512,
    maxBytes: 100,
    minByteLength: 1,
    minDurationSeconds: 0,
  });
  let clock = 0;
  deps.now = () => clock;
  const controller = createRecorderController(deps);
  await controller.start();
  clock += 1000;
  await assert.rejects(
    () => controller.stop(),
    (err: unknown) => {
      assert.equal((err as CaptureRecorderError).code, "too_large");
      return true;
    },
  );
  assert.ok(MAX_AUDIO_BYTES > 100);
});

test("onCapture contract: stub transcribe then callback with Capture", async () => {
  const transcript = "Ninety minutes labor and two valves at Juniper Cafe.";
  const capture: Capture = {
    id: "cap_test_1",
    source: "browser_mic",
    sourceId: "browser-mic-test-1",
    sessionId: null,
    capturedAt: "2026-11-14T20:00:00.000Z",
    retrievedAt: "2026-11-14T20:00:02.000Z",
    contentHash: createHash("sha256").update(transcript).digest("hex"),
    transcript,
  };

  const { deps } = makeDeps();
  let clock = 0;
  deps.now = () => clock;
  const controller = createRecorderController(deps);
  await controller.start();
  clock += 1500;
  const audio = await controller.stop();

  async function transcribeAudio(input: RecorderAudioInput): Promise<Capture> {
    assert.equal(input.source, "browser_mic");
    assert.ok(input.byteLength > 0);
    return { ...capture, capturedAt: input.capturedAt };
  }

  const received: Capture[] = [];
  async function onCapture(next: Capture) {
    received.push(next);
  }

  const result = await transcribeAudio(audio);
  await onCapture(result);
  assert.equal(received.length, 1);
  assert.equal(received[0]?.id, "cap_test_1");
  assert.equal(received[0]?.source, "browser_mic");
  assert.match(received[0]?.contentHash ?? "", /^[a-f0-9]{64}$/);
});
