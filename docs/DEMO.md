# Worvo — Demo Runbook

**Goal:** collected voice data becomes a detailed invoice that is reviewed and sent.

**Status:** rehearsal specification; integrations remain unimplemented.

## Canonical synthetic scenario

A technician has finished repairing a cafe sink. Use a safe prop and a simulated completed visit. Business/customer details and prices are preconfigured; there is no quoting, dispatch, or scheduling step.

| Fixture | Value |
| --- | --- |
| Business | Worvo Demo Maintenance; USD; America/Los_Angeles |
| Customer | Juniper Cafe, synthetic billing details |
| Work reference | `WORK-104`, cafe sink repair |
| Labor | 90 minutes at $120/hour |
| Parts | Two shutoff valves at $22.50 each |
| Service date | November 14, 2026, explicitly confirmed |
| Fees/tax | No fees; tax not assessed — demo |
| Recipient | Team-controlled test email, explicitly configured and confirmed |
| Payment terms | Synthetic terms explicitly confirmed during setup |

## Spoken script and invoice

> “Worvo, work one oh four for Juniper Cafe. On this visit, I replaced two shutoff valves and worked for 90 minutes. The leak is fixed.”

Readback: “Prepare an invoice for 90 minutes of labor and two shutoff valves for Juniper Cafe?” Confirm the extracted details, then preview:

| Description | Quantity | Rate | Amount |
| --- | --- | --- | --- |
| Labor: replace cafe sink shutoff valves | 1.5 hours | $120.00/hour | $180.00 |
| Shutoff valves supplied | 2 | $22.50 each | $45.00 |
| **Subtotal / demo total due** | | | **$225.00** |

Show business/customer identity, invoice number/date, service reference/date, configured terms, and work summary. Internal evidence links each line to the original account; the customer document excludes raw conversations and private source links. The total comes from persisted details and confirmed prices.

Approve the exact invoice and recipient, then select **Send invoice**. A real test send uses a team-controlled inbox with authorization. Show the provider acceptance receipt; say “accepted for sending,” not “delivered” unless actual delivery is verified. No payment is collected.

## 90-second sequence

| Time | Action |
| --- | --- |
| 0–15 s | Show the safe repair prop and explain: “Describe the work; Worvo prepares the invoice.” |
| 15–35 s | Speak the update or retrieve a real earlier wearable recording; show the actual source label |
| 35–55 s | Show extracted work details, readback, and confirmation |
| 55–75 s | Show the detailed $225 invoice, evidence, recipient, and approval |
| 75–90 s | Send the approved invoice to the test inbox; show acceptance status and the customer-facing document |

For retrieved memory, say it was recorded earlier and show the timestamp. The stored conversation cannot approve a send. Browser playback does not establish bracelet return audio.

## Rehearsal and recovery

- [ ] Reset only synthetic records; verify confirmed prices and the authorized test recipient.
- [ ] Confirm invoice identity, terms, and tax/demo labels before the test send.
- [ ] Repeat capture confirmation/sync; total remains $225 with two invoice lines.
- [ ] Edit a line after approval; sending is blocked until the new version is approved.
- [ ] Test double-click send and an ambiguous timeout; reconcile without blind resend.
- [ ] Rehearse three times; keep a consented recording with source and delivery-mode labels visible.

If wearable access fails, use **Live microphone** and disclose the incomplete hardware gate. If inference fails, offer **Recorded demo** fixtures explicitly. If email access is unavailable, show a **Test delivery preview** or download the invoice and disclose that real sending remains incomplete. A fixture must never silently send to a real customer.

## Submission description

> Worvo turns collected descriptions of physical work into detailed invoices. A worker describes the completed service by voice; Worvo extracts labor, parts, and work details, builds an itemized invoice using confirmed prices, and sends it after the owner reviews and approves it. Invoice details remain traceable to the original work evidence.

Add only actually working integration modes, verified test-send results, links, and known limitations. This documentation update sends no invoice or event submission.
