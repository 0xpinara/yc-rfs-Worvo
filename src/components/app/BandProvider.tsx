"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { webBluetoothAvailability } from "@/lib/vexo/band-identity";
import {
  BandSession,
  type BandLedStatus,
  type BandRecording,
  type BandSessionProvenance,
} from "@/lib/vexo/band-session";

export type BandStatus = "idle" | "connecting" | "connected" | "recording";
/**
 * Companion light state. Wrist LED: kit forces solid blue while the mic stream is on;
 * "mic" is shown as a red blink in the UI so recording reads clearly next to amber/green.
 */
export type BandLight = BandLedStatus | "mic";

export type BandApi = {
  status: BandStatus;
  light: BandLight;
  provenance: BandSessionProvenance | null;
  error: string | null;
  unavailable: string | null;
  connect: (opts?: { sim?: boolean }) => Promise<void>;
  disconnect: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<BandRecording>;
  showLight: (next: BandLedStatus) => Promise<void>;
  onDoubleTap: (handler: (() => void) | null) => void;
  onTap: (handler: (() => void) | null) => void;
  /** Live loudness from the band mic while recording, for the voice animation (null clears it). */
  onLevel: (handler: ((rms: number) => void) | null) => void;
};

const BandContext = createContext<BandApi | null>(null);
const noSubscribe = () => () => {};

/**
 * App-wide band session. Survives client navigations (home ↔ capture ↔ invoices).
 * Still drops on a full browser refresh — Web Bluetooth can't outlive the document.
 */
export function BandProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<BandSession | null>(null);
  const [status, setStatus] = useState<BandStatus>("idle");
  const [light, setLight] = useState<BandLight>("off");
  const [provenance, setProvenance] = useState<BandSessionProvenance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unavailable = useSyncExternalStore(
    noSubscribe,
    () => {
      const availability = webBluetoothAvailability();
      return availability.ok ? null : availability.message;
    },
    () => null,
  );

  useEffect(() => {
    const session = new BandSession();
    sessionRef.current = session;
    const stop = session.onLinkLost(() => {
      setProvenance(null);
      setLight("off");
      setStatus("idle");
    });
    return () => {
      stop();
      // Root provider unmount = leaving the SPA document; release the radio.
      void session.disconnect();
      sessionRef.current = null;
    };
  }, []);

  const connect = useCallback(async (opts?: { sim?: boolean }) => {
    const session = sessionRef.current;
    if (!session) return;
    setError(null);
    setStatus("connecting");
    try {
      setProvenance(await session.connect({ sim: opts?.sim === true }));
      setError(null);
      setStatus("connected");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn’t connect to the band.";
      setStatus("idle");
      if (!/no band picked|cancelled|user cancelled/i.test(message)) {
        setError(message);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    await sessionRef.current?.disconnect();
    setProvenance(null);
    setLight("off");
    setStatus("idle");
  }, []);

  const startRecording = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) throw new Error("Connect the band first.");
    await session.startRecording();
    setLight("mic");
    setStatus("recording");
  }, []);

  const stopRecording = useCallback(async (): Promise<BandRecording> => {
    const session = sessionRef.current;
    if (!session) throw new Error("Connect the band first.");
    try {
      return await session.stopRecording();
    } finally {
      setLight("off");
      setStatus(session.isConnected ? "connected" : "idle");
    }
  }, []);

  const showLight = useCallback(async (next: BandLedStatus) => {
    await sessionRef.current?.setStatusLed(next);
    setLight(next);
  }, []);

  const onDoubleTap = useCallback((handler: (() => void) | null) => {
    sessionRef.current?.onDoubleTap(handler);
  }, []);

  const onTap = useCallback((handler: (() => void) | null) => {
    sessionRef.current?.onTap(handler);
  }, []);

  const onLevel = useCallback((handler: ((rms: number) => void) | null) => {
    sessionRef.current?.onLevel(handler);
  }, []);

  const value = useMemo<BandApi>(
    () => ({
      status,
      light,
      provenance,
      error,
      unavailable,
      connect,
      disconnect,
      startRecording,
      stopRecording,
      showLight,
      onDoubleTap,
      onTap,
      onLevel,
    }),
    [
      status,
      light,
      provenance,
      error,
      unavailable,
      connect,
      disconnect,
      startRecording,
      stopRecording,
      showLight,
      onDoubleTap,
      onTap,
      onLevel,
    ],
  );

  return <BandContext.Provider value={value}>{children}</BandContext.Provider>;
}

/** Shared band connection — same instance across routes while this tab stays open. */
export function useBand(): BandApi {
  const ctx = useContext(BandContext);
  if (!ctx) {
    throw new Error("useBand must be used within BandProvider");
  }
  return ctx;
}
