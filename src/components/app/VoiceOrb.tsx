"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./App.module.css";
import { BARS, type VoiceFrame, type VoiceSource } from "./voice-meter";

const SIZE = 340; // canvas size in CSS pixels, centred on the orb
const ORB = 54; // record orb radius
const SKY = [169, 199, 255] as const;

type Ripple = { born: number; strength: number };

/**
 * Wraps the record button with a voice-reactive canvas: a ring of light bars shaped by the voice,
 * ripples that spread with each word, and a glow that grows with loudness. It also publishes the
 * smoothed loudness as the CSS variable --voice on the nearest [data-voice-root] (orb, Tally).
 */
export function VoiceOrb({ source, children }: { source: VoiceSource | null; children: ReactNode }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!source || !canvas || !wrap) return;
    const root = wrap.closest<HTMLElement>("[data-voice-root]") ?? wrap;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const frame: VoiceFrame = { level: 0, bins: new Float32Array(BARS) };
    const bins = new Float32Array(BARS);
    const ripples: Ripple[] = [];
    let level = 0;
    let lastRipple = 0;
    let raf = 0;
    const c = SIZE / 2;

    const draw = (now: number) => {
      source.read(frame, now);
      // Fast attack, slow release: words pop, silences settle.
      level = Math.max(frame.level, level * 0.9);
      for (let i = 0; i < BARS; i += 1) bins[i] = Math.max(frame.bins[i], bins[i] * 0.86);
      root.style.setProperty("--voice", level.toFixed(3));

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Glow behind the orb, brighter and wider as the voice gets louder.
      const glow = ctx.createRadialGradient(c, c, ORB * 0.8, c, c, ORB + 40 + level * 60);
      glow.addColorStop(0, `rgba(${SKY.join(",")}, ${0.16 + level * 0.34})`);
      glow.addColorStop(1, `rgba(${SKY.join(",")}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(c, c, ORB + 100, 0, Math.PI * 2);
      ctx.fill();

      // Ripples: a new ring with each burst of speech, like the rings on the landing page.
      if (!calm && level > 0.28 && now - lastRipple > 520 - level * 300) {
        ripples.push({ born: now, strength: level });
        lastRipple = now;
      }
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const progress = (now - ripples[i].born) / 1500;
        if (progress >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const eased = 1 - (1 - progress) ** 3;
        ctx.strokeStyle = `rgba(${SKY.join(",")}, ${ripples[i].strength * (1 - progress) ** 2 * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c, c, ORB + 10 + eased * 78, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ring of bars: the spectrum mirrored around the circle so it stays balanced; slowly turning.
      const turn = calm ? -Math.PI / 2 : -Math.PI / 2 + now / 9000;
      const base = ORB + 12;
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      for (let i = 0; i < BARS * 2; i += 1) {
        const k = i < BARS ? i : BARS * 2 - 1 - i;
        const v = Math.min(1, bins[k] * (0.4 + 0.75 * level) + 0.03);
        const angle = turn + (i / (BARS * 2)) * Math.PI * 2;
        const length = 3 + v * 40;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // Sky at rest, warming to white at the peaks.
        const r = Math.round(SKY[0] + (255 - SKY[0]) * v);
        const g = Math.round(SKY[1] + (255 - SKY[1]) * v);
        ctx.strokeStyle = `rgba(${r}, ${g}, 255, ${0.45 + 0.55 * v})`;
        ctx.beginPath();
        ctx.moveTo(c + cos * base, c + sin * base);
        ctx.lineTo(c + cos * (base + length), c + sin * (base + length));
        ctx.stroke();
      }

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(raf);
      root.style.removeProperty("--voice");
      ctx.clearRect(0, 0, SIZE, SIZE);
    };
  }, [source]);

  return (
    <span ref={wrapRef} className={styles.voiceOrb} data-active={Boolean(source)}>
      <canvas ref={canvasRef} className={styles.voiceCanvas} aria-hidden="true" />
      {children}
    </span>
  );
}
