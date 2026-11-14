import Stripe from "stripe";
import { InvoiceError } from "../invoices/errors";

let cached: { key: string; client: Stripe } | null = null;

/** Test mode only: a live key is refused before any request is made. */
export function stripeClient(env: NodeJS.ProcessEnv = process.env): Stripe {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new InvoiceError("provider_unavailable", "STRIPE_SECRET_KEY is not set in .env.local");
  }
  if (!/^(sk|rk)[a-z]*_test_/.test(key)) {
    throw new InvoiceError("provider_unavailable", "Worvo runs on Stripe test mode only: use a test key (sk_test_, rk_test_ or rkcs_test_)");
  }
  if (cached?.key !== key) {
    cached = { key, client: new Stripe(key, { appInfo: { name: "worvo" } }) };
  }
  return cached.client;
}

export function stripeWebhookSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new InvoiceError("provider_unavailable", "STRIPE_WEBHOOK_SECRET is not set (copy it from `stripe listen`)");
  }
  return secret;
}
