import type { ApiErrorCode, ApiResult } from "../../shared/contracts";
import { InvoiceError } from "./errors";

const STATUS: Record<ApiErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  invalid_input: 422,
  unresolved_fields: 422,
  stale_revision: 409,
  duplicate_visit: 409,
  send_locked: 409,
  send_unknown: 409,
  idempotency_conflict: 409,
  provider_unavailable: 503,
};

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data } satisfies ApiResult<T>, { status });
}

export function fail(error: unknown): Response {
  if (error instanceof InvoiceError) {
    const body: ApiResult<never> = {
      ok: false,
      error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) },
    };
    return Response.json(body, { status: STATUS[error.code] });
  }
  const stripeType = (error as { type?: unknown } | null)?.type;
  const message = typeof stripeType === "string" && stripeType.startsWith("Stripe")
    ? `Stripe: ${(error as Error).message}`
    : "Unexpected server error";
  console.error("[worvo]", error);
  const body: ApiResult<never> = { ok: false, error: { code: "provider_unavailable", message } };
  return Response.json(body, { status: 503 });
}
