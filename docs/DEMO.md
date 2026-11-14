# Worvo demo: a plumber speaks an invoice

Status: specification only. No live integration is claimed.

## Setup once

One plumber, their Stripe sandbox account, USD, a saved synthetic Juniper Cafe customer, a verified test recipient mapping, $120/hour labor, and shutoff valves at $22.50 each. Use a controlled test recipient, never a guessed real cafe email.

The demonstration does not include technician signup, job matching, dispatch, inventory, or manager approval. Tax is not assessed in the synthetic fixture; this is not a live tax determination.

## Spoken request

> Worvo, invoice Juniper Cafe for today's sink repair. Ninety minutes of labor at my usual rate and two shutoff valves at the standard price. Send it to their saved billing email.

Expected proposal:

| Line | Calculation | Amount |
| --- | --- | --- |
| Sink repair labor | 90 minutes at $120/hour | $180.00 |
| Shutoff valves | 2 at $22.50 | $45.00 |
| Fixture total | No assessed demo tax | $225.00 |

The band has no assumed speaker. Show the proposal and status on the companion phone. Optional speech plays through that phone or headphones. Band 53's Python BLE motion stream has been verified on the development laptop; audio, phone integration, gestures and light controls remain unverified and are separate checks.

## Demonstration sequence

1. Briefly show saved customer/rates and a connected sandbox, then close the setup screen.
2. Speak the request through the actual tested capture path. Label real Vexo capture, live microphone, or recorded demo.
3. Show the extracted proposal and exact evidence. If the fresh band-command authorization gate passed, advance without phone interaction. Otherwise use authenticated phone approval and disclose that fallback.
4. Show the one Stripe invoice and its hosted test payment page. A test-mode send request is simulated; do not say a real email arrived.
5. Complete a test payment and show webhook-reconciled paid state. No real money is collected.

If showing a recording captured earlier, disclose the capture time and retrieval delay. It cannot authorize sending just because it contains the words “send it.”

## Useful exception

Say “invoice Juniper Cafe for $45 in parts.” The system should ask whether that is the customer selling amount, rather than infer catalog quantities, costs, or a recipient. Keep the invoice pending until resolved.

## Rehearsal checks

- Repeat capture processing and send requests: still one invoice.
- Retry after partial Stripe failure: resume the same operation.
- Change the recipient or lines: old approval is invalid.
- Compare the preview, Stripe invoice/PDF, recipient, and send payload with the authorized revision. Raw transcripts and private citations stay out of customer output.
- While a send outcome is unknown, edits and blind resend remain blocked until reconciliation.
- Replay a historic send instruction: no authorization.
- Delay/replay webhook events: paid state remains correct.
- Verify $225.00 subtotal/payable fixture total and expected two lines.
- Run on the actual band/phone, with recording consent and source labels.
- Record A09 (real band draft) and A10 (band-only authorized send) separately.

For actual email delivery, arrange a separately authorized live send to a controlled consenting recipient after account, pricing, and tax setup. Sandbox send events are not delivery evidence.

Recovery: real band unavailable → labeled real phone microphone; no fresh band authorization → authenticated phone approval; provider unavailable → visibly labeled synthetic fixture. These fallbacks do not count as full band-only success.
