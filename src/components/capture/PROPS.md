# CaptureRecorder props (Person C)

Import from `@/components/capture`.

```ts
type CaptureRecorderProps = {
  onCapture: (capture: Capture) => void | Promise<void>;
  transcribeAudio: (input: RecorderAudioInput) => Promise<Capture>;
  disabled?: boolean;   // e.g. signed out
  busy?: boolean;       // parent drafting / mutating
  error?: string | null; // parent API error to surface
  onRecorderError?: (error: CaptureRecorderError) => void;
};
```

- Place the component; do not reimplement mic logic.
- Wire `transcribeAudio` to authenticated `POST /api/captures/transcribe` when that route exists.
- After `onCapture`, keep `capture.id` and call B's draft endpoint.
- A owns permission/silence/cleanup; no localStorage secrets or client API keys.
