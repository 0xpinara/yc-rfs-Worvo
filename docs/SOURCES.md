# Worvo sources and integration checks

This registry supports the revised solo-plumber voice-to-invoice scope. It replaces assumptions from the earlier dispatch/inventory plan. Product decisions live in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Stripe

Official documentation consulted through Context7 and the Stripe docs CLI:

- [Invoicing integration](https://docs.stripe.com/invoicing/integration): create and manage customer-specific invoices and handle payment events.
- [Create invoice](https://docs.stripe.com/api/invoices/create): send_invoice collection, automatic advancement controls, customer and currency.
- [Create invoice item](https://docs.stripe.com/api/invoiceitems/create): attach each line to the intended invoice.
- [Finalize invoice](https://docs.stripe.com/api/invoices/finalize): draft-to-open transition.
- [Send invoice](https://docs.stripe.com/api/invoices/send): explicit send; test-mode calls do not send email even though invoice.sent occurs.
- [Hosted invoice page](https://docs.stripe.com/invoicing/hosted-invoice-page): customer invoice/payment page.
- [Webhooks](https://docs.stripe.com/webhooks): signature verification and event handling.
- [Invoice event types](https://docs.stripe.com/api/events/types): invoice.paid includes paid-out-of-band invoices; distinguish paid status from Stripe-collected funds.
- [Payment Links versus Invoicing](https://docs.stripe.com/payment-links#compare-invoicing-and-payment-links): customer-specific invoices fit this workflow.

These are documented capabilities, not exercised requests. Account readiness, permissions, actual SDK/API versions, delivery, tax policy, and live payment behavior remain untested.

## Vexo and the band

[Public Vexo documentation](https://www.vexoai.com/docs) was recorded in the prior plan as read-only memory retrieval over MCP with OAuth, including get_context, search_transcripts, get_transcript, and fetch. Recheck current live tool schemas and access before implementation. This update did not independently revalidate the provider interface.

The official kit is cloned locally as `../vexo-open-kit`, origin `https://github.com/VexoAI-Org/vexo-open-kit.git`. Its AGENTS.md/getting-started/API documents describe BLE/USB, motion, Opus microphone packets, LED control, and the browser dashboard. This kit is a distinct input path from cloud MCP memory retrieval. No speaker is assumed.

On 2026-11-14, `../.venv/Scripts/python.exe ../connect_watch.py` (from this repo) connected specifically to Vexo-HACK-53, reported firmware 1.1.0, and received 30 real motion readings over three seconds, then disconnected. That proves BLE/motion on the Windows laptop only. No recording, browser-to-app session provenance, phone BLE, LED control, or financial authorization was exercised. The dashboard HTTP endpoint returned 200; its controls were not hardware-tested.

A retrieved transcript provides evidence, not permission to send customer invoices. The fresh band-only authorization mechanism, ingestion timing, raw audio availability, motion events, and light control are unverified. Phone approval remains the fallback; optional audio output comes from the phone or headphones.

## Other sponsor capabilities

Previously consulted official documentation supports these candidate roles. No credits, sponsorship terms, or account access were verified.

| Reference | Candidate use |
| --- | --- |
| [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output) | Preferred invoice field extraction; validate meaning/evidence beyond JSON shape |
| [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) | Alternative extraction model; handle refusals/incomplete output |
| [Deepgram pre-recorded transcription](https://developers.deepgram.com/reference/speech-to-text/listen-pre-recorded) | Raw-audio transcription if accessible; no need to retranscribe existing Vexo text |
| [ElevenLabs JS SDK](https://github.com/elevenlabs/elevenlabs-js) | Optional companion-device readback |
| [MiniMax TTS](https://platform.minimax.io/docs/api-reference/speech-t2a-http) | Alternative optional readback |
| [Brex expense management](https://www.brex.com/product/expense-management) | Deferred expense-reconciliation discovery; no API integration claimed |

## Integration check log

| Check | Result |
| --- | --- |
| Band-53 BLE connection and motion | Passed on Windows laptop; firmware 1.1.0, 30 motion samples; disconnected afterward |
| Real band recording and attributable retrieval | Not run |
| Fresh authenticated band command bound to exact invoice revision | Unverified; required for band-only send |
| Motion/light programmatic control | Motion stream verified via Python; light and gesture controls unverified; optional |
| Model extraction and raw-audio transcription | Not run |
| Stripe sandbox customer/draft/finalize/send request | Not run |
| Hosted test payment and signed webhook reconciliation | Not run |
| Actual invoice email delivery | Not run; test-mode send cannot prove it |
| Live account/tax configuration | Not checked |

Record redacted evidence, actual model/API versions, source timing, checks, and limitations as work proceeds. Never record keys, private invoice links, or real customer transcripts in Git.

## Vision and event context

[YC Requests for Startups](https://www.ycombinator.com/rfs) and [VexoHacks](https://www.vexoai.com/hackathon) supplied earlier product/event context. This scope update does not reverify their current content, schedules, tracks, or submission rules. Confirm event requirements separately. The first draft is the invoice workflow, not the earlier broader coordination vision.
