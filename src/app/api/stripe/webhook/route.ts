import { fail } from "@/server/invoices/http";
import { invoiceStore } from "@/server/invoices/store";
import { stripeClient, stripeWebhookSecret } from "@/server/stripe/client";
import { handleStripeWebhook } from "@/server/stripe/webhook";

// Local demo: `stripe listen --forward-to 127.0.0.1:3000/api/stripe/webhook`
export async function POST(request: Request) {
  let stripe;
  let secret;
  try {
    stripe = stripeClient();
    secret = stripeWebhookSecret();
  } catch (error) {
    return fail(error);
  }
  const rawBody = await request.text();
  try {
    const outcome = handleStripeWebhook(stripe, invoiceStore(), rawBody, request.headers.get("stripe-signature") ?? "", secret);
    return Response.json({ received: true, outcome });
  } catch {
    return Response.json({ received: false, error: "Invalid Stripe signature" }, { status: 400 });
  }
}
