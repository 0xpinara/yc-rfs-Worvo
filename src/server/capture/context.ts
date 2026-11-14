/**
 * B owns real auth. Until B exports requireBusinessContext(), A routes use this
 * bridge: default rejects unauthenticated callers; tests inject an explicit fake.
 * Local-only demo identity when DEMO_MODE + DEMO_IDENTITY_ENABLED (never for public deploy).
 */

export type BusinessContext = {
  businessId: string;
  actorId: string;
  /** Provenance only — not proof of identity. */
  sessionId: string | null;
};

export type AuthFailure = {
  code: "unauthenticated" | "forbidden";
  message: string;
};

export type AuthResult =
  | { ok: true; context: BusinessContext }
  | { ok: false; error: AuthFailure };

export type RequireBusinessContext = () => Promise<AuthResult>;

function demoIdentityAllowed(): boolean {
  return process.env.DEMO_MODE === "true" && process.env.DEMO_IDENTITY_ENABLED === "true";
}

const unauthenticatedStub: RequireBusinessContext = async () => {
  if (demoIdentityAllowed()) {
    return {
      ok: true,
      context: fakeBusinessContext({
        businessId: "demo-biz",
        actorId: "demo-actor",
        sessionId: "demo-session",
      }),
    };
  }
  return {
    ok: false,
    error: {
      code: "unauthenticated",
      message: "Authentication is not wired yet. Waiting on B's requireBusinessContext().",
    },
  };
};

let requireBusinessContextImpl: RequireBusinessContext = unauthenticatedStub;

/** B (or tests) replace the default unauthenticated stub. */
export function setRequireBusinessContext(fn: RequireBusinessContext): void {
  requireBusinessContextImpl = fn;
}

export function resetRequireBusinessContext(): void {
  requireBusinessContextImpl = unauthenticatedStub;
}

export async function requireBusinessContext(): Promise<AuthResult> {
  return requireBusinessContextImpl();
}

export function fakeBusinessContext(
  overrides: Partial<BusinessContext> = {},
): BusinessContext {
  return {
    businessId: "biz-test-1",
    actorId: "actor-test-1",
    sessionId: "session-test-1",
    ...overrides,
  };
}
