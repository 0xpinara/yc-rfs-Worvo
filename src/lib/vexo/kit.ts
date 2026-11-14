/**
 * Client-only entry to the official Vexo open kit (MIT).
 * Import this module only from `"use client"` code or dynamic import().
 *
 * Kit path: vendored MIT client at third_party/vexo-open-kit/js/src
 * (synced from sibling ../vexo-open-kit; see third_party/README.md).
 */
import { BAND_NUMBER } from "@/shared/contracts";

export const WORVO_BAND_NUMBER = BAND_NUMBER;

// Relative to this file: src/lib/vexo → ../../../third_party/vexo-open-kit/js/src
export type VexoKit = typeof import("../../../third_party/vexo-open-kit/js/src/index.js");

let kitPromise: Promise<VexoKit> | null = null;

export function loadVexoKit(): Promise<VexoKit> {
  if (!kitPromise) {
    kitPromise = import("../../../third_party/vexo-open-kit/js/src/index.js");
  }
  return kitPromise;
}

export function kitAttribution(): string {
  return "Vexo open kit (MIT) — https://github.com/VexoAI-Org/vexo-open-kit";
}
