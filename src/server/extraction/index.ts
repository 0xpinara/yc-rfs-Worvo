export { extractProposal, type ExtractProposalOptions } from "./extract";
export { extractWithGemini, type GeminiExtractOptions, type GeminiExtractOutcome } from "./gemini";
export {
  normalizeTranscript,
  normalizeForFixtureMatch,
  evidenceInTranscript,
  transcriptsMatch,
} from "./normalize";
export { proposalFromCandidate, type ExtractionCandidate } from "./candidate";
