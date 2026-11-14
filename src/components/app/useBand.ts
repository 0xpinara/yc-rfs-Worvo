"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { webBluetoothAvailability } from "@/lib/vexo/band-identity";
import {
  BandSession,
  type BandLedStatus,
  type BandRecording,
  type BandSessionProvenance,
} from "@/lib/vexo/band-session";

export type BandStatus = "idle" | "connecting" | "connected" | "recording";
/** What the band's light is showing: the kit's status colours, plus "mic" (solid blue while recording). */
export type BandLight = BandLedStatus | "mic";

const noSubscribe = () => () => {};

/**
 * Thin UI wrapper around Peyton's BandSession (official Vexo kit): connect band 53,
 * record, set the status light and arm the double-tap. All band logic stays in BandSession.
 */
export function useBand() {
  const sessionRef = useRef<BandSession | null>(null);
  const [status, setStatus] = useState<BandStatus>("idle");
  const [light, setLight] = useState<BandLight>("off");
  const [provenance, setProvenance] = useState<BandSessionProvenance | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Why the band can't connect in this browser (null = it can). Server render assumes it can.
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
    return () => {
      void session.disconnect();
      sessionRef.current = null;
    };
  }, []);

  const connect = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    setError(null);
    setStatus("connecting");
    try {
      setProvenance(await session.connect());
      setStatus("connected");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Couldn’t connect to the band.");
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

  /** Sets the band's status colour (ignored by the band while the mic is on). */
  const showLight = useCallback(async (next: BandLedStatus) => {
    await sessionRef.current?.setStatusLed(next);
    setLight(next);
  }, []);

  /** Arms (or clears, with null) what a double-tap on the band does. */
  const onDoubleTap = useCallback((handler: (() => void) | null) => {
    sessionRef.current?.onDoubleTap(handler);
  }, []);

  return { status, light, provenance, error, unavailable, connect, disconnect, startRecording, stopRecording, showLight, onDoubleTap };
}
