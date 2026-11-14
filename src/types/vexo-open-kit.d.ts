/**
 * Minimal typings for the official Vexo open kit JS client (MIT).
 * Source: third_party/vexo-open-kit/js/src (junction to sibling kit).
 */
declare module "../../../third_party/vexo-open-kit/js/src/index.js" {
  export class VexoError extends Error {
    code: string;
    found?: number;
    wanted?: number;
  }

  export class Band {
    static connect(
      number: number | null,
      options?: {
        transport?: "ble" | "serial" | "sim" | object;
        timeoutMs?: number;
        autoReconnect?: boolean;
        reconnectSeconds?: number;
      },
    ): Promise<Band>;

    number: number | null;
    name: string | null;
    connected: boolean;
    info?: { firmware?: string } | null;
    on(event: string, handler: (...args: never[]) => void): () => void;
    off(event: string, handler: (...args: never[]) => void): void;
    configure(options: {
      audio?: boolean;
      micLevel?: boolean;
      motion?: number | boolean;
      events?: boolean;
    }): Promise<void>;
    setLed(
      colourOrR: string | number,
      g?: number | { brightness?: number; pattern?: string; period?: number },
      b?: number,
      options?: { brightness?: number; pattern?: string; period?: number },
    ): Promise<void>;
    ledOff(): Promise<void>;
    setEvents(options: { kinds?: string[]; tapThreshold?: number }): Promise<unknown>;
    disconnect(): Promise<void>;
  }

  export class BandAudio {
    constructor(
      onSamples: (samples: Float32Array, info: { rate: number; lost: number }) => void,
      options?: { rate?: number; onError?: (error: Error) => void },
    );
    readonly lost: number;
    push(packet: { seq: number; opus: Uint8Array }): void;
    restart(): void;
    close(): void;
  }

  export class SimTransport {
    constructor(number?: number, options?: { audioPackets?: Uint8Array[]; realtime?: boolean });
    kind: string;
  }

  export function canDecodeAudio(): Promise<boolean>;
  export function toInt16(samples: Float32Array): Int16Array;
  export function oggPackets(bytes: Uint8Array): Uint8Array[];
  export function bandName(number: number): string;
  export const AUDIO_RATE: number;
  export const AUDIO_FRAME_MS: number;
  export const SERVICE_UUID: string;
  export const NAME_PREFIX: string;
}
