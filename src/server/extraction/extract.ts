import type { Capture, Proposal } from "../../shared/contracts";
import { DEMO_PROPOSAL, DEMO_TRANSCRIPT } from "../../fixtures/invoice";
import { proposalFromCandidate, type ExtractionCandidate } from "./candidate";
import { normalizeTranscript, transcriptsMatch } from "./normalize";

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  "forty-five": 45,
  fortyfive: 45,
  sixty: 60,
  ninety: 90,
};

function parsePositiveIntToken(token: string): number | null {
  const lower = token.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(WORD_NUMBERS, lower)) {
    return WORD_NUMBERS[lower]!;
  }
  if (/^\d+$/.test(token)) {
    const value = Number(token);
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  return null;
}

function isUnsupportedQuantityToken(token: string): boolean {
  const lower = token.toLowerCase();
  if (lower === "half" || lower === "zero") {
    return true;
  }
  if (lower === "0" || /^-\d+$/.test(token) || /^\d+\.\d+$/.test(token) || /^-\d+\.\d+$/.test(token)) {
    return true;
  }
  return false;
}

function hasCatalogRateCue(text: string): boolean {
  return /\b(usual rate|my rate|standard (?:price|rate)|catalog|saved (?:rate|price))\b/i.test(text);
}

function hasSendCue(text: string): boolean {
  return /\bsend(?:\s+it)?\b/i.test(text);
}

function looksLikeAmbiguousPartsAmount(text: string): boolean {
  return /\$\s*\d+(?:\.\d+)?\s+in\s+parts\b/i.test(text)
    || /\bparts\b[^.]{0,40}\$\s*\d+/i.test(text)
    || /\$\s*\d+(?:\.\d+)?\s+(?:of\s+)?(?:parts|materials)\b/i.test(text);
}

function extractCustomerReference(text: string): string | null {
  const match = text.match(/\binvoice\s+(.+?)\s+for\b/i);
  if (!match) {
    return null;
  }
  const raw = match[1]!.trim();
  if (raw.length === 0 || /@/.test(raw) || /^\$?\d/.test(raw)) {
    return null;
  }
  return raw;
}

function extractDescription(text: string): string {
  const work = text.match(/\b((?:sink|faucet|drain|pipe|toilet|water heater)\s+repair)\b/i);
  if (work) {
    const phrase = work[1]!.toLowerCase();
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }
  const match = text.match(/\bfor\s+(?:today'?s\s+)?([^.,]+)/i);
  if (!match) {
    return "Service";
  }
  const description = match[1]!.trim().replace(/\s+/g, " ");
  return description.length > 0 ? description : "Service";
}

function extractLabor(text: string): {
  minutes: number | null;
  evidence: string | null;
  unresolved: string[];
} {
  const unresolved: string[] = [];
  const match = text.match(
    /\b((?:ninety|sixty|thirty|forty-five|fortyfive|fifteen|\d+)\s+minutes?(?:\s+of\s+labor)?(?:\s+at\s+[^.]+)?)/i,
  );
  if (!match) {
    return { minutes: null, evidence: null, unresolved };
  }
  const evidence = match[1]!.trim();
  const qtyToken = evidence.split(/\s+/)[0]!;
  const minutes = parsePositiveIntToken(qtyToken);
  if (minutes === null) {
    unresolved.push("labor_minutes");
    return { minutes: null, evidence: null, unresolved };
  }
  if (!hasCatalogRateCue(evidence) && !hasCatalogRateCue(text)) {
    unresolved.push("labor_rate");
  }
  return { minutes, evidence, unresolved };
}

function extractMaterials(text: string): {
  materials: NonNullable<ExtractionCandidate>["materials"];
  unresolved: string[];
} {
  const unresolved: string[] = [];
  const materials: NonNullable<ExtractionCandidate>["materials"] = [];

  if (looksLikeAmbiguousPartsAmount(text)) {
    unresolved.push("materials");
    unresolved.push("parts_amount");
    return { materials, unresolved };
  }

  // Reject fractional / zero / negative quantities before positive parsing.
  // Avoid relying on \b before "-", which can split "-2" into a bare "2".
  if (
    /\b(?:half(?:\s+an?)?|zero)\s+(?:shutoff\s+)?valves?\b/i.test(text)
    || /(?:^|[\s,;])(?:0|-?\d+\.\d+|-\d+)\s+(?:shutoff\s+)?valves?\b/i.test(text)
  ) {
    unresolved.push("material_quantity");
    return { materials, unresolved };
  }

  const fullEvidenceMatch = text.match(
    /\b((one|two|three|four|five|six|seven|eight|nine|ten|[1-9]\d*)\s+shutoff\s+valves?(?:\s+at\s+[^.]+)?)/i,
  );
  if (!fullEvidenceMatch) {
    return { materials, unresolved };
  }

  const materialEvidence = fullEvidenceMatch[1]!.trim();
  const qtyToken = fullEvidenceMatch[2]!;
  if (isUnsupportedQuantityToken(qtyToken)) {
    unresolved.push("material_quantity");
    return { materials, unresolved };
  }

  const quantity = parsePositiveIntToken(qtyToken);
  if (quantity === null) {
    unresolved.push("material_quantity");
    return { materials, unresolved };
  }

  materials.push({
    reference: "shutoff valve",
    quantity,
    evidence: materialEvidence,
  });

  if (!/\b(?:standard price|catalog|saved price)\b/i.test(text) && !hasCatalogRateCue(materialEvidence)) {
    unresolved.push("material_price");
  }

  return { materials, unresolved };
}

function heuristicCandidate(transcript: string): ExtractionCandidate {
  const text = normalizeTranscript(transcript);
  const unresolved: string[] = [];

  const customerReference = extractCustomerReference(text);
  if (customerReference === null) {
    unresolved.push("customer");
  }

  const description = extractDescription(text);
  const labor = extractLabor(text);
  unresolved.push(...labor.unresolved);

  const materialResult = extractMaterials(text);
  unresolved.push(...materialResult.unresolved);

  if (/\blabor\b/i.test(text) && labor.minutes === null && !unresolved.includes("labor_minutes")) {
    unresolved.push("labor_minutes");
  }

  return {
    customerReference,
    description,
    serviceDate: null,
    laborMinutes: labor.minutes,
    materials: materialResult.materials,
    laborEvidence: labor.evidence,
    requestedIntent: hasSendCue(text) ? "send_requested" : "draft",
    unresolved,
  };
}

function fixtureProposal(): Proposal {
  return {
    customerReference: DEMO_PROPOSAL.customerReference,
    description: DEMO_PROPOSAL.description,
    serviceDate: DEMO_PROPOSAL.serviceDate,
    laborMinutes: DEMO_PROPOSAL.laborMinutes,
    materials: DEMO_PROPOSAL.materials.map((item) => ({ ...item })),
    laborEvidence: DEMO_PROPOSAL.laborEvidence,
    requestedIntent: DEMO_PROPOSAL.requestedIntent,
    unresolved: [...DEMO_PROPOSAL.unresolved],
  };
}

export type ExtractProposalOptions = {
  /** When true, call Gemini after fixture miss (requires key + AI_MODEL). Default false keeps tests offline. */
  useProvider?: boolean;
  apiKey?: string | null;
  model?: string | null;
  fetchFn?: typeof fetch;
};

function providerEnabledByEnv(): boolean {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() ?? "google";
  if (provider !== "google") return false;
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ?? "";
  const model = process.env.AI_MODEL?.trim() ?? "";
  return key.length > 0 && model.length > 0;
}

/**
 * Extraction entry point: labeled fixture → optional Gemini → bounded heuristic.
 * Provider results are untrusted and must pass proposalFromCandidate.
 * No approval, totals, email, or business identity may be set.
 */
export async function extractProposal(
  capture: Capture,
  options: ExtractProposalOptions = {},
): Promise<Proposal> {
  const transcript = normalizeTranscript(capture.transcript);
  if (transcript.length === 0) {
    return proposalFromCandidate(capture.transcript, null);
  }

  if (transcriptsMatch(transcript, DEMO_TRANSCRIPT) || capture.sourceId === "canonical-utterance-v1") {
    return fixtureProposal();
  }

  const useProvider = options.useProvider ?? providerEnabledByEnv();
  if (useProvider) {
    const { extractWithGemini } = await import("./gemini");
    const outcome = await extractWithGemini(transcript, {
      apiKey: options.apiKey,
      model: options.model,
      fetchFn: options.fetchFn,
    });
    if (outcome.ok) {
      return proposalFromCandidate(transcript, outcome.candidate);
    }
    // Local heuristic only — do not auto-fallback to another vendor.
  }

  return proposalFromCandidate(transcript, heuristicCandidate(transcript));
}
