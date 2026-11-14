import { randomUUID } from "node:crypto";
import { CaptureSchema, type Capture } from "../../shared/contracts";
import type { BusinessContext } from "./context";
import { hashTranscriptContent } from "./hash";

export type SaveCaptureInput = {
  source: Capture["source"];
  sourceId: string;
  sessionId: string | null;
  capturedAt: string;
  transcript: string;
  /** true = live stream; false = prerecorded / typed. */
  liveAudio: boolean;
};

export type SaveCaptureResult =
  | { ok: true; capture: Capture; deduped: boolean }
  | { ok: false; code: "invalid_input"; message: string; fields?: string[] };

export type CaptureStore = {
  saveCapture(context: BusinessContext, input: SaveCaptureInput): Promise<SaveCaptureResult>;
};

type Stored = {
  businessId: string;
  capture: Capture;
  liveAudio: boolean;
};

/**
 * In-memory store for A's tests and local wiring until B's durable saveCapture exists.
 * Scoped by businessId + sourceId. Same content hash + sourceId returns the same capture.
 */
export function createMemoryCaptureStore(): CaptureStore {
  const bySource = new Map<string, Stored>();

  return {
    async saveCapture(context, input) {
      const transcript = input.transcript.trim();
      if (transcript.length === 0 || transcript.length > 10000) {
        return {
          ok: false,
          code: "invalid_input",
          message: "Transcript must be 1–10000 characters.",
          fields: ["transcript"],
        };
      }
      if (!input.sourceId.trim()) {
        return {
          ok: false,
          code: "invalid_input",
          message: "sourceId is required.",
          fields: ["sourceId"],
        };
      }

      const contentHash = hashTranscriptContent(transcript);
      const key = `${context.businessId}::${input.sourceId}`;
      const existing = bySource.get(key);
      if (existing && existing.capture.contentHash === contentHash) {
        return { ok: true, capture: existing.capture, deduped: true };
      }

      const retrievedAt = new Date().toISOString();
      const capture = CaptureSchema.parse({
        id: randomUUID(),
        source: input.source,
        sourceId: input.sourceId,
        sessionId: input.sessionId ?? context.sessionId,
        capturedAt: input.capturedAt,
        retrievedAt,
        contentHash,
        transcript,
      });

      bySource.set(key, { businessId: context.businessId, capture, liveAudio: input.liveAudio });
      return { ok: true, capture, deduped: false };
    },
  };
}

let captureStore: CaptureStore = createMemoryCaptureStore();

export function setCaptureStore(store: CaptureStore): void {
  captureStore = store;
}

export function resetCaptureStore(): void {
  captureStore = createMemoryCaptureStore();
}

export async function saveCapture(
  context: BusinessContext,
  input: SaveCaptureInput,
): Promise<SaveCaptureResult> {
  return captureStore.saveCapture(context, input);
}
