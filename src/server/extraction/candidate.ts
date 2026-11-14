import { ProposalSchema, type Proposal } from "../../shared/contracts";
import { evidenceInTranscript, normalizeTranscript } from "./normalize";

export type ExtractionCandidate = Partial<{
  customerReference: string | null;
  description: string;
  serviceDate: string | null;
  laborMinutes: number | null;
  materials: Array<{
    reference?: string;
    quantity?: number;
    evidence?: string;
  }>;
  laborEvidence: string | null;
  requestedIntent: string;
  unresolved: string[];
  // Forbidden authority fields that must never survive into a Proposal.
  approved?: unknown;
  approval?: unknown;
  email?: unknown;
  customerEmail?: unknown;
  totalCents?: unknown;
  totals?: unknown;
  businessId?: unknown;
  actorId?: unknown;
  toolCalls?: unknown;
}> | null | undefined;

const FORBIDDEN_KEYS = [
  "approved",
  "approval",
  "email",
  "customerEmail",
  "totalCents",
  "totals",
  "businessId",
  "actorId",
  "toolCalls",
] as const;

function pushUnique(list: string[], value: string): void {
  if (!list.includes(value)) {
    list.push(value);
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Turn untrusted model/heuristic output into a schema-valid Proposal.
 * Refused or empty candidates become a safe unresolved draft.
 * Evidence must quote the transcript; bad quantities stay unresolved.
 */
export function proposalFromCandidate(
  transcript: string,
  candidate: ExtractionCandidate,
): Proposal {
  const source = normalizeTranscript(transcript);
  const unresolved: string[] = [];

  if (candidate == null || typeof candidate !== "object") {
    return ProposalSchema.parse({
      customerReference: null,
      description: "Incomplete extraction",
      serviceDate: null,
      laborMinutes: null,
      materials: [],
      laborEvidence: null,
      requestedIntent: "draft",
      unresolved: ["extraction_refused"],
    });
  }

  for (const key of FORBIDDEN_KEYS) {
    if (Object.prototype.hasOwnProperty.call(candidate, key) && candidate[key] !== undefined) {
      pushUnique(unresolved, "forbidden_authority");
    }
  }

  let customerReference: string | null = null;
  if (typeof candidate.customerReference === "string") {
    const trimmed = candidate.customerReference.trim();
    if (trimmed.length > 0) {
      customerReference = trimmed;
    } else {
      pushUnique(unresolved, "customer");
    }
  } else if (candidate.customerReference === null || candidate.customerReference === undefined) {
    pushUnique(unresolved, "customer");
  } else {
    pushUnique(unresolved, "customer");
  }

  // Never accept an email-shaped customer reference as resolved identity.
  if (customerReference !== null && /@/.test(customerReference)) {
    customerReference = null;
    pushUnique(unresolved, "customer");
    pushUnique(unresolved, "customer_email");
  }

  let description =
    typeof candidate.description === "string" && candidate.description.trim().length > 0
      ? candidate.description.trim()
      : "Service";
  if (description.length === 0) {
    description = "Service";
    pushUnique(unresolved, "description");
  }

  let serviceDate: string | null = null;
  if (typeof candidate.serviceDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.serviceDate)) {
    serviceDate = candidate.serviceDate;
  } else if (candidate.serviceDate != null && candidate.serviceDate !== undefined) {
    pushUnique(unresolved, "service_date");
  }

  let laborMinutes: number | null = null;
  let laborEvidence: string | null = null;
  if (candidate.laborMinutes === null || candidate.laborMinutes === undefined) {
    if (candidate.laborEvidence) {
      pushUnique(unresolved, "labor_minutes");
    }
  } else if (isPositiveInt(candidate.laborMinutes)) {
    laborMinutes = candidate.laborMinutes;
    if (typeof candidate.laborEvidence === "string" && candidate.laborEvidence.trim().length > 0) {
      const evidence = candidate.laborEvidence.trim();
      if (evidenceInTranscript(source, evidence)) {
        laborEvidence = evidence;
      } else {
        laborMinutes = null;
        pushUnique(unresolved, "labor_evidence");
      }
    } else {
      laborMinutes = null;
      pushUnique(unresolved, "labor_evidence");
    }
  } else {
    pushUnique(unresolved, "labor_minutes");
  }

  const materials: Proposal["materials"] = [];
  if (Array.isArray(candidate.materials)) {
    for (const item of candidate.materials) {
      if (item == null || typeof item !== "object") {
        pushUnique(unresolved, "materials");
        continue;
      }
      const quantity = item.quantity;
      if (!isPositiveInt(quantity)) {
        pushUnique(unresolved, "material_quantity");
        continue;
      }
      const reference =
        typeof item.reference === "string" && item.reference.trim().length > 0
          ? item.reference.trim()
          : null;
      const evidence =
        typeof item.evidence === "string" && item.evidence.trim().length > 0
          ? item.evidence.trim()
          : null;
      if (reference === null || evidence === null) {
        pushUnique(unresolved, "materials");
        continue;
      }
      if (!evidenceInTranscript(source, evidence)) {
        pushUnique(unresolved, "material_evidence");
        continue;
      }
      materials.push({ reference, quantity, evidence });
    }
  }

  let requestedIntent: Proposal["requestedIntent"] = "draft";
  if (candidate.requestedIntent === "send_requested") {
    requestedIntent = "send_requested";
  } else if (candidate.requestedIntent === "draft" || candidate.requestedIntent == null) {
    requestedIntent = "draft";
  } else {
    // Unknown intents (including injected "approved") stay draft.
    requestedIntent = "draft";
    pushUnique(unresolved, "requested_intent");
  }

  if (Array.isArray(candidate.unresolved)) {
    for (const item of candidate.unresolved) {
      if (typeof item === "string" && item.trim().length > 0) {
        pushUnique(unresolved, item.trim());
      }
    }
  }

  return ProposalSchema.parse({
    customerReference,
    description,
    serviceDate,
    laborMinutes,
    materials,
    laborEvidence,
    requestedIntent,
    unresolved,
  });
}
