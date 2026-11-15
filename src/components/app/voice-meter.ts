// Live voice levels for the record animation. Read-only listeners: they never touch the recording itself.

export const BARS = 32;

/** One animation frame of voice: overall loudness and a coarse spectrum, both 0..1. */
export type VoiceFrame = { level: number; bins: Float32Array };

export type VoiceSource = {
  read: (frame: VoiceFrame, now: number) => void;
  stop: () => void;
};

/** Maps RMS amplitude to 0..1 on a decibel scale: about -58 dB is silence, -16 dB is a loud voice. */
export function levelFromRms(rms: number): number {
  const db = 20 * Math.log10(Math.max(rms, 1e-5));
  return Math.min(1, Math.max(0, (db + 58) / 42));
}

/**
 * Phone or laptop mic: a second listen-only stream on the same microphone (permission is already
 * granted by the recorder), analysed with Web Audio. Speech lives low, so bars cover ~90 Hz-5 kHz.
 */
export async function micVoice(): Promise<VoiceSource> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.72;
  context.createMediaStreamSource(stream).connect(analyser);
  const freq = new Uint8Array(analyser.frequencyBinCount);
  const wave = new Uint8Array(analyser.fftSize);
  const hz = context.sampleRate / analyser.fftSize;
  const low = Math.max(1, Math.round(90 / hz));
  const high = Math.min(freq.length - 1, Math.round(5000 / hz));

  return {
    read(frame) {
      analyser.getByteTimeDomainData(wave);
      let sum = 0;
      for (let i = 0; i < wave.length; i += 1) {
        const v = (wave[i] - 128) / 128;
        sum += v * v;
      }
      frame.level = levelFromRms(Math.sqrt(sum / wave.length));
      analyser.getByteFrequencyData(freq);
      for (let i = 0; i < BARS; i += 1) {
        // Log-spaced bands, like hearing: more bars for low and mid frequencies.
        const from = Math.floor(low * Math.pow(high / low, i / BARS));
        const to = Math.max(from + 1, Math.floor(low * Math.pow(high / low, (i + 1) / BARS)));
        let peak = 0;
        for (let k = from; k < to; k += 1) peak = Math.max(peak, freq[k]);
        frame.bins[i] = peak / 255;
      }
    },
    stop() {
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
    },
  };
}

/**
 * Loudness pushed in from elsewhere (the Vexo band's decoded audio). The spectrum is shaped
 * around speech and moves with the real loudness, so the animation still follows the voice.
 */
export function pushedVoice(): VoiceSource & { push: (rms: number) => void } {
  let level = 0;
  return {
    push(rms) {
      level = Math.max(levelFromRms(rms), level * 0.6);
    },
    read(frame, now) {
      const t = now / 1000;
      frame.level = level;
      for (let i = 0; i < BARS; i += 1) {
        const speech = 0.45 + 0.55 * Math.exp(-(((i - 9) / 9) ** 2));
        const flutter = 0.55 + 0.45 * Math.sin(t * 7.3 + i * 0.83) * Math.sin(t * 3.1 + i * 0.41);
        frame.bins[i] = level * speech * flutter;
      }
      level *= 0.96;
    },
    stop() {
      level = 0;
    },
  };
}

/** Gentle stand-in when no live levels are available (for example, mic access refused). */
export function idleVoice(): VoiceSource {
  return {
    read(frame, now) {
      const t = now / 1000;
      frame.level = 0.18 + 0.08 * Math.sin(t * 2.2);
      for (let i = 0; i < BARS; i += 1) frame.bins[i] = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(t * 2.6 + i * 0.7));
    },
    stop() {},
  };
}
