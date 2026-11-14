import { createHash } from "node:crypto";
import { normalizeTranscript } from "../extraction/normalize";

/** Server-side content hash for capture dedup. Never trust a client-supplied hash. */
export function hashTranscriptContent(transcript: string): string {
  const normalized = normalizeTranscript(transcript);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
