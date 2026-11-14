import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPECTED_BAND_NAME,
  EXPECTED_BAND_NUMBER,
  assertExpectedBand,
  webBluetoothAvailability,
} from "../src/lib/vexo/band-identity";

test("expected band identity is Vexo-HACK-53", () => {
  assert.equal(EXPECTED_BAND_NUMBER, 53);
  assert.equal(EXPECTED_BAND_NAME, "Vexo-HACK-53");
});

test("assertExpectedBand rejects other numbers and names", () => {
  assert.equal(assertExpectedBand("Vexo-HACK-07", 7).ok, false);
  assert.equal(assertExpectedBand("Vexo-HACK-53", 53).ok, true);
  assert.equal(assertExpectedBand("Vexo-HACK-53", 99).ok, false);
});

test("webBluetoothAvailability reports no-window outside a browser", () => {
  const result = webBluetoothAvailability(undefined, true);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "no-window");
});
