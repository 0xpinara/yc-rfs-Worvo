import { handleTextCapture } from "@/server/capture/text-capture";
import type { ApiResult, Capture } from "@/shared/contracts";

export const runtime = "nodejs";

function jsonResult(result: ApiResult<{ capture: Capture }>, statusForOk = 200): Response {
  if (result.ok) {
    return Response.json(result, { status: statusForOk });
  }
  const status =
    result.error.code === "unauthenticated" ? 401
    : result.error.code === "forbidden" ? 403
    : result.error.code === "provider_unavailable" ? 503
    : 422;
  return Response.json(result, { status });
}

/**
 * POST /api/captures/text — typed or authenticated bridge transcript.
 * Requires B's requireBusinessContext(); returns 401 until wired.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResult({
      ok: false,
      error: { code: "invalid_input", message: "Expected JSON body." },
    });
  }

  if (body === null || typeof body !== "object") {
    return jsonResult({
      ok: false,
      error: { code: "invalid_input", message: "Expected JSON object." },
    });
  }

  const result = await handleTextCapture(body as Parameters<typeof handleTextCapture>[0], {
    idempotencyKey: request.headers.get("idempotency-key"),
  });
  return jsonResult(result);
}
