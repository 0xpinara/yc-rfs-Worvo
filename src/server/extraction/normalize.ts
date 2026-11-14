const MAX_TRANSCRIPT_CHARS = 10_000;

/** Collapse whitespace and strip control chars; bound length to CaptureSchema max. */
export function normalizeTranscript(raw: string): string {
  const withoutControls = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  const collapsed = withoutControls.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_TRANSCRIPT_CHARS) {
    return collapsed;
  }
  return collapsed.slice(0, MAX_TRANSCRIPT_CHARS);
}

export function transcriptsMatch(a: string, b: string): boolean {
  return normalizeTranscript(a).toLowerCase() === normalizeTranscript(b).toLowerCase();
}

/** Evidence must appear as a contiguous excerpt of the source transcript. */
export function evidenceInTranscript(transcript: string, evidence: string): boolean {
  const source = normalizeTranscript(transcript).toLowerCase();
  const excerpt = normalizeTranscript(evidence).toLowerCase();
  return excerpt.length > 0 && source.includes(excerpt);
}
