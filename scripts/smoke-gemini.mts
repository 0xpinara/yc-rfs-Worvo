import { readFileSync } from "node:fs";
import { extractWithGemini } from "../src/server/extraction/gemini.ts";
import { proposalFromCandidate } from "../src/server/extraction/candidate.ts";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i <= 0) continue;
  const key = line.slice(0, i);
  const value = line.slice(i + 1);
  if (!process.env[key]) process.env[key] = value;
}

const transcript =
  "Invoice Juniper Cafe for sink repair. Ninety minutes of labor at my usual rate and two shutoff valves at the standard price. Send it.";

const outcome = await extractWithGemini(transcript);
if (!outcome.ok) {
  console.log(JSON.stringify({
    ok: false,
    reason: outcome.reason,
    message: outcome.message.slice(0, 160),
  }));
  process.exit(1);
}

const proposal = proposalFromCandidate(transcript, outcome.candidate);
console.log(JSON.stringify({
  ok: true,
  model: outcome.model,
  customer: proposal.customerReference,
  laborMinutes: proposal.laborMinutes,
  materials: proposal.materials.length,
  intent: proposal.requestedIntent,
  unresolved: proposal.unresolved,
  hasEmail: JSON.stringify(proposal).includes("@"),
}));
