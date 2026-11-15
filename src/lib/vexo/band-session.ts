import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from "@/shared/contracts";
import { EXPECTED_BAND_NAME, EXPECTED_BAND_NUMBER } from "./band-identity";
import { loadVexoKit, WORVO_BAND_NUMBER, type VexoKit } from "./kit";
import { pcm16ToWavBlob } from "./wav";

export type BandSessionProvenance = {
  bandName: string;
  bandNumber: number;
  connectedAt: string;
  transport: "web-bluetooth" | "sim";
  numberVerified: true;
  sessionId: string;
  firmware?: string | null;
};

export type BandRecording = {
  blob: Blob;
  mimeType: "audio/wav";
  durationSeconds: number;
  byteLength: number;
  capturedAt: string;
  captureEndedAt: string;
  source: "vexo_ble";
  provenance: BandSessionProvenance;
  liveAudio: true;
  packetsLost: number;
};

type BandInstance = Awaited<ReturnType<VexoKit["Band"]["connect"]>>;
type BandAudioInstance = InstanceType<VexoKit["BandAudio"]>;

export type BandSessionOptions = {
  /** Use the kit pretend band (no hardware). Optional sample Opus packets for voice. */
  sim?: boolean;
  audioPackets?: Uint8Array[];
};

export type BandLedStatus = "off" | "ready_amber" | "blocked_red" | "sent_blue" | "paid_green";

/**
 * Official-kit band session for Worvo: Band.connect(53) → configure(audio) → PCM WAV.
 * Microphone blue LED while audio is on — stop audio before amber/green status colours.
 * Demo path (AGENTS.md): amber blink when draft is sendable → double-tap sends → green when paid.
 */
export class BandSession {
  private kit: VexoKit | null = null;
  private band: BandInstance | null = null;
  private sound: BandAudioInstance | null = null;
  private chunks: Float32Array[] = [];
  private sampleRate = 16000;
  private recording = false;
  private captureStartedAt: string | null = null;
  private provenance: BandSessionProvenance | null = null;
  private stopAudioListener: (() => void) | null = null;
  private stopDoubleTap: (() => void) | null = null;
  private packetsLost = 0;
  private doubleTapHandler: (() => void) | null = null;
  private linkLostHandlers = new Set<() => void>();
  /** Bumps on every LED request so a slow amber blink can't overwrite a later solid blue. */
  private ledGeneration = 0;
  /** Runs LED writes one at a time so BLE replies can't land out of order. */
  private ledQueue: Promise<void> = Promise.resolve();

  get isConnected(): boolean {
    return Boolean(this.band?.connected);
  }

  get isRecording(): boolean {
    return this.recording;
  }

  getProvenance(): BandSessionProvenance | null {
    return this.provenance;
  }

  async connect(options: BandSessionOptions = {}): Promise<BandSessionProvenance> {
    await this.disconnect();
    const kit = await loadVexoKit();
    this.kit = kit;

    const transport = options.sim
      ? new kit.SimTransport(WORVO_BAND_NUMBER, {
          audioPackets: options.audioPackets,
          realtime: true,
        })
      : "ble";

    const band = await kit.Band.connect(WORVO_BAND_NUMBER, { transport });
    if (band.number !== EXPECTED_BAND_NUMBER) {
      await band.disconnect().catch(() => {});
      throw new Error(
        `Rejected band ${band.name ?? band.number}: expected ${EXPECTED_BAND_NAME} (#${EXPECTED_BAND_NUMBER}).`,
      );
    }

    this.band = band;
    const connectedAt = new Date().toISOString();
    const info = band as BandInstance & { info?: { firmware?: string } | null };
    this.provenance = {
      bandName: band.name ?? EXPECTED_BAND_NAME,
      bandNumber: band.number ?? EXPECTED_BAND_NUMBER,
      connectedAt,
      transport: options.sim ? "sim" : "web-bluetooth",
      numberVerified: true,
      sessionId: `vexo-${EXPECTED_BAND_NUMBER}-${connectedAt}`,
      firmware: info.info?.firmware ?? null,
    };

    band.on("disconnect", (() => {
      void this.cleanupAudio();
      this.stopDoubleTap?.();
      this.stopDoubleTap = null;
      this.band = null;
      this.provenance = null;
      this.recording = false;
      for (const handler of this.linkLostHandlers) handler();
    }) as never);

    // Event stream for double-tap send (mic must be off when we set LEDs).
    try {
      await band.setEvents({ kinds: ["double-tap", "tap"] });
      await band.configure({ events: true });
    } catch {
      // Sim or older firmware may not expose events; send UI fallback still works.
    }

    return this.provenance;
  }

  /**
   * Status colours after the mic is off.
   * Amber blink = draft good, double-tap to send. Solid blue = sent. Green = paid.
   */
  setStatusLed(status: BandLedStatus): Promise<void> {
    const generation = ++this.ledGeneration;
    this.ledQueue = this.ledQueue
      .then(async () => {
        // Superseded by a newer colour request — skip this write entirely.
        if (generation !== this.ledGeneration) return;
        if (!this.band || this.recording) return;
        try {
          if (status === "off") {
            await this.band.ledOff();
          } else if (status === "ready_amber") {
            await this.band.setLed("#ffbf00", { brightness: 1, pattern: "blink", period: 600 });
          } else if (status === "blocked_red") {
            await this.band.setLed("#ff2200", { brightness: 0.8, pattern: "solid", period: 1000 });
          } else if (status === "sent_blue") {
            // Solid (not blink/breathing) so it clearly replaces the amber ready blink.
            await this.band.setLed("#2244ff", { brightness: 0.85, pattern: "solid", period: 1000 });
          } else {
            await this.band.setLed("#00cc44", { brightness: 1, pattern: "solid", period: 1000 });
          }
        } catch {
          // LED optional if mic still owns it or link dropped.
        }
      })
      .catch(() => {
        // Keep the queue alive after a failed write.
      });
    return this.ledQueue;
  }

  /** UI subscribe: band radio dropped (out of range, sleep, another tab took it). */
  onLinkLost(handler: () => void): () => void {
    this.linkLostHandlers.add(handler);
    return () => {
      this.linkLostHandlers.delete(handler);
    };
  }

  /** Arm or clear the double-tap → send handler. */
  onDoubleTap(handler: (() => void) | null): void {
    this.stopDoubleTap?.();
    this.stopDoubleTap = null;
    this.doubleTapHandler = handler;
    if (!handler || !this.band) return;
    this.stopDoubleTap = this.band.on("double-tap", (() => {
      this.doubleTapHandler?.();
    }) as never);
  }

  async startRecording(): Promise<void> {
    if (!this.band || !this.kit) {
      throw new Error("Connect the band before recording.");
    }
    if (this.recording) return;

    const canDecode = await this.kit.canDecodeAudio();
    if (!canDecode) {
      throw new Error(
        "This browser cannot decode band Opus (WebCodecs). Use current Chrome or Edge on localhost/https.",
      );
    }

    this.chunks = [];
    this.packetsLost = 0;
    this.captureStartedAt = new Date().toISOString();
    this.sound = new this.kit.BandAudio(
      (samples, info) => {
        this.sampleRate = info.rate;
        this.packetsLost = info.lost;
        if (this.recording) this.chunks.push(samples.slice());
      },
      { rate: 16000 },
    );

    this.stopAudioListener = this.band.on("audio", ((packet: { seq: number; opus: Uint8Array }) => {
      this.sound?.push(packet);
    }) as never);

    await this.band.configure({ audio: true });
    this.recording = true;
  }

  async stopRecording(): Promise<BandRecording> {
    if (!this.recording || !this.kit || !this.provenance) {
      throw new Error("Not recording.");
    }

    this.recording = false;
    const endedAt = new Date().toISOString();
    const startedAt = this.captureStartedAt ?? endedAt;
    const lost = this.packetsLost;

    try {
      await this.band?.configure({ audio: false });
    } catch {
      // still assemble what we have
    }
    await this.cleanupAudio();

    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    this.chunks = [];

    const durationSeconds = this.sampleRate > 0 ? total / this.sampleRate : 0;
    if (durationSeconds <= 0.05 || total < 160) {
      const err = new Error("No speech detected from the band microphone.") as Error & { code: string };
      err.code = "silence";
      throw err;
    }
    if (durationSeconds > MAX_AUDIO_SECONDS) {
      const err = new Error(`Recording exceeds ${MAX_AUDIO_SECONDS} seconds.`) as Error & { code: string };
      err.code = "too_long";
      throw err;
    }

    const pcm = this.kit.toInt16(merged);
    const blob = pcm16ToWavBlob(pcm, this.sampleRate);
    if (blob.size > MAX_AUDIO_BYTES) {
      const err = new Error(`Recording exceeds ${MAX_AUDIO_BYTES} bytes.`) as Error & { code: string };
      err.code = "too_large";
      throw err;
    }

    return {
      blob,
      mimeType: "audio/wav",
      durationSeconds,
      byteLength: blob.size,
      capturedAt: startedAt,
      captureEndedAt: endedAt,
      source: "vexo_ble",
      provenance: this.provenance,
      liveAudio: true,
      packetsLost: lost,
    };
  }

  async disconnect(): Promise<void> {
    this.recording = false;
    this.onDoubleTap(null);
    await this.cleanupAudio();
    if (this.band) {
      try {
        await this.band.configure({ audio: false, events: false });
      } catch {
        // ignore
      }
      try {
        await this.band.ledOff();
      } catch {
        // ignore
      }
      await this.band.disconnect().catch(() => {});
    }
    this.band = null;
    this.provenance = null;
    this.captureStartedAt = null;
  }

  private async cleanupAudio(): Promise<void> {
    this.stopAudioListener?.();
    this.stopAudioListener = null;
    this.sound?.close();
    this.sound = null;
  }
}
