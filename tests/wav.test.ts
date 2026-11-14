import assert from "node:assert/strict";
import test from "node:test";
import { pcm16ToWavBlob } from "../src/lib/vexo/wav";

test("pcm16ToWavBlob writes RIFF/WAVE header and payload size", async () => {
  const samples = new Int16Array([0, 1000, -1000, 0]);
  const blob = pcm16ToWavBlob(samples, 16000);
  assert.equal(blob.type, "audio/wav");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.equal(String.fromCharCode(...bytes.subarray(0, 4)), "RIFF");
  assert.equal(String.fromCharCode(...bytes.subarray(8, 12)), "WAVE");
  assert.equal(bytes.byteLength, 44 + samples.byteLength);
});
