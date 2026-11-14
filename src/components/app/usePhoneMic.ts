"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createBrowserRecorderDeps,
  createRecorderController,
  type RecorderController,
} from "@/components/capture/recorder-controller";

/** Phone or laptop microphone, using Peyton's bounded recorder controller (60 s / 20 MB limits). */
export function usePhoneMic() {
  const controllerRef = useRef<RecorderController | null>(null);

  useEffect(() => {
    const controller = createRecorderController(createBrowserRecorderDeps());
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (!controllerRef.current) throw new Error("The microphone isn’t ready yet.");
    await controllerRef.current.start();
  }, []);

  const stop = useCallback(async () => {
    if (!controllerRef.current) throw new Error("The microphone isn’t ready yet.");
    return controllerRef.current.stop();
  }, []);

  return { start, stop };
}
