"use client";

import { useEffect } from "react";
import fx from "./Fx.module.css";

const VARS = ["--rx", "--ry", "--mx", "--my"] as const;

/**
 * One document-level listener that tilts any `fx` button toward the cursor and moves its glare.
 * Mouse and pen only (no tilt on touch), off with reduced motion, throttled to one update per frame.
 */
export function FxController() {
  useEffect(() => {
    const selector = `.${fx.fx}`;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current: HTMLElement | null = null;
    let lastX = 0;
    let lastY = 0;
    let frame = 0;

    const reset = (el: HTMLElement) => VARS.forEach((name) => el.style.removeProperty(name));

    const apply = () => {
      frame = 0;
      if (!current) return;
      const box = current.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      const x = Math.min(1, Math.max(0, (lastX - box.left) / box.width));
      const y = Math.min(1, Math.max(0, (lastY - box.top) / box.height));
      const strength = Math.min(1, 170 / box.width); // wide buttons tilt less
      current.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      current.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      current.style.setProperty("--rx", `${((0.5 - y) * 16 * strength).toFixed(2)}deg`);
      current.style.setProperty("--ry", `${((x - 0.5) * 20 * strength).toFixed(2)}deg`);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reduce.matches) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
      if (target !== current) {
        if (current) reset(current);
        current = target;
      }
      if (!current || (current instanceof HTMLButtonElement && current.disabled)) return;
      lastX = event.clientX;
      lastY = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const onLeaveWindow = () => {
      if (current) reset(current);
      current = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      if (frame) window.cancelAnimationFrame(frame);
      if (current) reset(current);
    };
  }, []);

  return null;
}
