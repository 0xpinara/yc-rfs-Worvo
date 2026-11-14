# Worvo — Sources, Assumptions, and Integration Checks

**Research date:** November 14, 2026, America/Los_Angeles.

**Scope:** public references for the plan, not a hardware validation report.

**Origin:** the founder-supplied Worvo blueprint, rewritten into an executable project specification.

Use official references for external capabilities. Product scope, schemas, acceptance checks, schedules, and pricing fixtures elsewhere in this repository are Worvo design decisions unless explicitly attributed here.

## S1: YC Request for Startups

**Official source:** [YC Requests for Startups](https://www.ycombinator.com/rfs). Select **Fall 2026**, then **New Operating Systems for the Physical World**, by **Charlie Warren**. The page may open on a newer batch.

The relevant thesis combines AI work planning, human field work with wearables, and robots, including coordination and reliability. Worvo takes a focused part of that opportunity: wearable work descriptions become detailed invoices that the owner reviews and sends. The broader coordination thesis is context; service management is outside the MVP. This mapping is our interpretation, not YC endorsement.

The specific entry was found in the official site's indexed Fall 2026 content. The page's default rendered batch during research was Winter 2027, so do not describe this as the newest RFS or invent a deep-link anchor.

## S2: VexoHacks event

**Official sources:** [VexoHacks organizer page](https://www.vexoai.com/hackathon) and [YC event page](https://events.ycombinator.com/vexohacks).

The organizer's indexed public schedule lists **November 14, 2026**, with kickoff at **9:00 AM**, hacking at **10:15 AM**, submissions closing at **6:00 PM**, and judging at **6:30 PM**, all Pacific and subject to change. It describes **Voice**, **Vision**, and **Ambient** tracks. The founder-provided attendance text emphasizes wearable and real-world AI experiences.

Worvo's choice of Voice with Ambient as a secondary fit is our strategy. No detailed official judging rubric, required sponsor stack, team-size rule, pre-existing-code rule, or submission format was verified. Confirm these with organizers before relying on them. Public pages were partly inaccessible to direct extraction; the organizer's indexed content supplied the schedule and tracks.

Private attendance information, QR codes, account/session links, and personal check-in artifacts are intentionally excluded from this public repository.

## S3: Vexo developer documentation

**Official source:** [Vexo MCP documentation](https://www.vexoai.com/docs), displaying an October 25, 2026 update date.

Verified public interface:

- Read-only memory access over MCP Streamable HTTP at `https://api.vexoai.com/mcp`.
- OAuth 2.1 with PKCE (`S256`), discovery, registration, and scope `vexo:read`.
- Tools include `get_context`, `search_transcripts`, `get_transcript`, and `fetch`; use live `tools/list` schemas.
- Evidence includes source attribution; retrieval can be partial or paginated.

The page does not document general live bracelet microphone streaming or return audio. This is a documentation boundary, not proof that no event-only interface exists. Real hardware availability, ingestion latency, account readiness, and access must be tested. `search_transcripts` is phrase retrieval; do not assume semantic work-reference matching from that tool alone.

Worvo's adapter, confirmation policy, credential storage, bounded retrieval, and fallback behavior are implementation decisions in the [plan](IMPLEMENTATION_PLAN.md#4-wearable-feasibility-and-source-adapters).

## S4: Implementation references

Use the documentation matching the versions installed during scaffolding:

- [Drizzle transactions](https://orm.drizzle.team/docs/transactions): the chosen database layer supports explicit transaction boundaries.
- [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side/nextjs): reference for Next.js session handling; authenticate on the server.
- [Vercel AI SDK structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data): schema-constrained extraction. The current page uses `generateText` with structured output; do not copy an older `generateObject` recipe without checking the installed SDK.
- [ElevenLabs transcription](https://elevenlabs.io/docs/overview/capabilities/speech-to-text): reference for the preferred recorded-audio transcription adapter. Select the actual supported model during setup.

These choices retain the existing repository's preferred stack while limiting P0 to one working provider per capability. Package access, credential validity, and runtime compatibility remain untested.

## Assumptions to validate

| Assumption | Current status | Required action |
| --- | --- | --- |
| An event bracelet can record under an accessible consenting account | Unverified | Test with hardware before claiming integration |
| Its evidence becomes available quickly enough for this demo | Unverified; no assumed SLA | Measure capture-to-first-retrieval latency |
| Sponsor AI/speech services or credits are available | Unverified | Test credentials and supported interfaces |
| The team can provision a PostgreSQL database in time | Unverified | Migrate/seed early; preserve a labeled local fallback |
| The chosen browser supports recording and spoken playback | Unverified | Test the exact demo device/browser |
| The event permits the team's code history and demo method | Unverified | Check organizer rules |
| A final submission requires a public deployment | Unverified | Confirm fields; protect deployment or use the allowed alternative |
| A delivery provider can send to the authorized demo recipient | Unverified | Verify sandbox restrictions, credentials, deduplication and reconciliation |
| Maintenance teams value voice-derived invoicing enough to pay | Product hypothesis | Interview buyers and measure existing work |

## Integration check log

No hardware, AI, transcription, database, invoice delivery, or hosting capability was exercised while preparing these documents. Update this log during T00 and subsequent implementation.

| Check | Result | Evidence to record |
| --- | --- | --- |
| Wearable capture | Not run | Device path, consenting test identity alias, captured time |
| Authorized retrieval | Not run | Tool used, redacted source identity, first successful retrieval time |
| Evidence linkage | Not run | Whether excerpt/timestamp/citation is available and resolves |
| Duplicate retrieval | Not run | Existing proposal returned; no additional invoice lines |
| Real microphone | Not run | Browser, MIME format, utterance, transcribed result |
| Spoken readback | Not run | Playback path and observed latency |
| Database transaction checks | Not run | Migration version and actual command/results |
| Invoice test sending | Not run | Authorized team-controlled recipient, approved version, provider receipt, retry behavior |
| Protected deployment | Not run | URL, authentication mode, disabled fixture/reset controls |

Record no secrets, full tokens, private account identifiers, or personal conversations in this log.
