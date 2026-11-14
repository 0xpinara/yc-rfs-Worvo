"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EXPECTED_BAND_NAME, EXPECTED_BAND_NUMBER, webBluetoothAvailability } from "@/lib/vexo/band-identity";
import { BandSession, type BandSessionProvenance } from "@/lib/vexo/band-session";
import { kitAttribution } from "@/lib/vexo/kit";

export type BandConnectProvenance = BandSessionProvenance;

export type BandConnectProps = {
  onConnected?: (provenance: BandConnectProvenance) => void;
  onDisconnected?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  /** Dev/test: kit pretend band */
  allowSim?: boolean;
};

/**
 * Connect-only control using official kit `Band.connect(53)` with post-connect number verify.
 * Prefer `BandCapture` when you also need microphone capture.
 */
export function BandConnect({
  onConnected,
  onDisconnected,
  onError,
  disabled = false,
  allowSim = false,
}: BandConnectProps) {
  const sessionRef = useRef<BandSession | null>(null);
  const [availabilityMessage] = useState<string | null>(() => {
    if (allowSim) return null;
    const avail = webBluetoothAvailability();
    return avail.ok ? null : avail.message;
  });
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [provenance, setProvenance] = useState<BandConnectProvenance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useSim, setUseSim] = useState(false);

  useEffect(() => {
    const session = new BandSession();
    sessionRef.current = session;
    return () => {
      void session.disconnect();
      sessionRef.current = null;
    };
  }, []);

  const disconnect = useCallback(async () => {
    await sessionRef.current?.disconnect();
    setProvenance(null);
    setStatus("idle");
    onDisconnected?.();
  }, [onDisconnected]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const next = await sessionRef.current!.connect({ sim: useSim && allowSim });
      setProvenance(next);
      setStatus("connected");
      onConnected?.(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Band connection failed.";
      setStatus("error");
      setError(message);
      onError?.(message);
    }
  }, [allowSim, onConnected, onError, useSim]);

  return (
    <section aria-label="Band 53 connection">
      <h2>Band {EXPECTED_BAND_NUMBER}</h2>
      <p>Connect only to {EXPECTED_BAND_NAME} via the official kit. Close the kit dashboard first.</p>
      <p><small>{kitAttribution()}</small></p>
      {allowSim ? (
        <label>
          <input
            type="checkbox"
            checked={useSim}
            disabled={status === "connected"}
            onChange={(e) => setUseSim(e.target.checked)}
          />
          {" "}Use pretend band (sim)
        </label>
      ) : null}
      {availabilityMessage && !useSim ? <p role="status">{availabilityMessage}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {provenance ? (
        <p>
          Connected: {provenance.bandName} at {provenance.connectedAt}
          {" "}(number verified via kit GET_INFO)
        </p>
      ) : null}
      <div>
        <button
          type="button"
          onClick={() => void connect()}
          disabled={disabled || status === "connecting" || status === "connected" || Boolean(availabilityMessage && !useSim)}
        >
          {status === "connecting" ? "Connecting…" : "Connect band 53"}
        </button>
        <button type="button" onClick={() => void disconnect()} disabled={status !== "connected"}>
          Disconnect
        </button>
      </div>
    </section>
  );
}
