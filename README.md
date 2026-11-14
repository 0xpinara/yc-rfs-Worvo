# WORVO

**Say it. Send the invoice.**

Worvo helps a solo plumber create and send a customer invoice by speaking to a wearable. Customers and rates are configured once. During a visit, the plumber describes the work and requests an invoice; Worvo extracts the details, checks them, and uses Stripe Invoicing to prepare the invoice and customer payment page.

**Status:** documentation only. No application, wearable command path, Stripe integration, or automated tests have been implemented.

## First draft

One plumber, one business, known customers, USD, and one voice-to-invoice workflow. Technician signup, verification, matching, dispatch, inventory, and manager approvals are outside this draft.

The target is no computer interaction during invoicing. Initial setup can use a phone/browser. Whether creation and sending can both be authorized entirely from the band depends on its actual command interface. Retrieved recordings alone do not establish current authorization to send an invoice.

The result is a detailed invoice with professional work descriptions, labor/part quantities and rates, totals, and configured terms. Evidence and corrections stay traceable internally. Stripe supplies the customer document and delivery flow; uncertain sends must be reconciled before edits or retries.

The founder describes the Vexo Open band as a microphone, motion sensor, and colour light, with no assumed speaker. Review and exceptions use a companion phone UI. Optional audio plays through the phone or headphones. Motion events and programmable light control remain unverified.

## Stripe and AI

- **Stripe Invoicing:** customer-specific draft, line items, finalization, email send request, hosted payment page, PDF, and payment status.
- **Gemini:** structured extraction from the plumber's words; OpenAI is an alternative.
- **Deepgram:** transcription when raw audio is accessible. Skip it when Vexo supplies usable text.
- **ElevenLabs or MiniMax:** optional companion-device readback after the core workflow works.
- **Brex:** deferred; expense reconciliation is outside this draft.

Start with one plumber's own Stripe sandbox account. Multi-business onboarding and account routing require a later Stripe Connect design even if Worvo never becomes a marketplace.

## Start here

| Document | Purpose |
| --- | --- |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Canonical scope, voice authorization boundary, Stripe flow, and acceptance checks |
| [Tasks](docs/TASKS.md) | Dependency-ordered build |
| [Demo](docs/DEMO.md) | Canonical utterance and expected invoice |
| [Sources](docs/SOURCES.md) | Official references and unverified capabilities |
| [Agent prompt](docs/AGENT_PROMPT.md) | Implementation kickoff |
| [AGENTS.md](AGENTS.md) | Repository rules |

Use one TypeScript application with Next.js, pnpm, Zod, Supabase Auth/PostgreSQL, Drizzle, one extraction provider, and Stripe. Select compatible package versions and actual models during setup. The [.env.example](.env.example) is a planning template; there are no application commands to run yet.
