import { BAND_NUMBER } from "@/shared/contracts";

/** Exact advertised name for this team's band. Reject any other. */
export const EXPECTED_BAND_NUMBER = BAND_NUMBER;
export const EXPECTED_BAND_NAME = `Vexo-HACK-${String(BAND_NUMBER).padStart(2, "0")}`;

/** Web Bluetooth service UUID from vexo-open-kit (MIT). See ../vexo-open-kit attribution. */
export const VEXO_BLE_SERVICE_UUID = "254f0001-df82-4a9c-a2b5-563a0f6b2021";

export type BandAvailability =
  | { ok: true }
  | { ok: false; reason: "no-window" | "insecure" | "no-web-bluetooth"; message: string };

export function webBluetoothAvailability(
  nav: Navigator | undefined = typeof navigator !== "undefined" ? navigator : undefined,
  secure: boolean | undefined = typeof window !== "undefined" ? window.isSecureContext : undefined,
): BandAvailability {
  if (typeof window === "undefined" || !nav) {
    return {
      ok: false,
      reason: "no-window",
      message: "Web Bluetooth only exists in browsers (Chrome or Edge), not on the server.",
    };
  }
  if (secure === false) {
    return {
      ok: false,
      reason: "insecure",
      message: "Bluetooth only works on https:// pages or localhost.",
    };
  }
  if (nav.bluetooth == null) {
    return {
      ok: false,
      reason: "no-web-bluetooth",
      message:
        "This browser has no Web Bluetooth. Use Chrome or Edge on a laptop or Android phone. iPhone/iPad cannot connect.",
    };
  }
  return { ok: true };
}

export function assertExpectedBand(name: string, reportedNumber: number | null): {
  ok: boolean;
  message: string;
} {
  if (reportedNumber !== EXPECTED_BAND_NUMBER && name !== EXPECTED_BAND_NAME) {
    return {
      ok: false,
      message: `Rejected band ${name || reportedNumber}: expected ${EXPECTED_BAND_NAME} (#${EXPECTED_BAND_NUMBER}).`,
    };
  }
  if (reportedNumber !== null && reportedNumber !== EXPECTED_BAND_NUMBER) {
    return {
      ok: false,
      message: `Rejected band number ${reportedNumber}: expected ${EXPECTED_BAND_NUMBER}.`,
    };
  }
  if (name && name !== EXPECTED_BAND_NAME) {
    return {
      ok: false,
      message: `Rejected band name ${name}: expected ${EXPECTED_BAND_NAME}.`,
    };
  }
  return { ok: true, message: `Connected to ${EXPECTED_BAND_NAME}.` };
}
