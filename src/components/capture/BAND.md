# Band 53 capture (Person A) — kit integration

## Expected device

- Number: **53** (from `BAND_NUMBER` in contracts)
- BLE name: **Vexo-HACK-53**
- Reject any other band (`Band.connect(53)` + GET_INFO verify)

## Official kit path

Worvo vendors the official kit JS client at `third_party/vexo-open-kit/js/src` (MIT; refresh via `pnpm ensure:vexo-kit` / sibling clone).

| Step | API |
| --- | --- |
| Connect | `Band.connect(53)` via `BandSession` / `BandCapture` |
| Mic on | `band.configure({ audio: true })` — solid **blue** LED |
| Decode | kit `BandAudio` (WebCodecs, Chrome/Edge) → 16 kHz PCM → WAV |
| Transcribe | server Deepgram (`mip_opt_out=true`), never client keys |
| Persist | `POST /api/captures/transcribe` with `source=vexo_ble` |

UI entry: [`/capture`](/capture) (`BandCapture` + `CaptureRecorder`).

## Setup

1. Kit must exist at `../vexo-open-kit` (or recreate the junction — see `third_party/README.md`).
2. Close kit dashboard / Python BLE before connecting (one Bluetooth consumer).
3. Chrome or Edge on `http://127.0.0.1:3000` (or https). Not iOS Safari.
4. Until B ships auth, set in `.env.local` (gitignored):

   ```
   DEMO_MODE=true
   DEMO_IDENTITY_ENABLED=true
   ```

5. Double-tap band → Connect → Start band mic → speak → Stop.

## Sim (no hardware)

`BandCapture allowSim` / pretend-band checkbox uses kit `SimTransport`. Without sample Opus packets the sim is silent (silence error is expected).

## Provenance for B

Persisted captures include stable `sourceId` (= session id), `capturedAt` / `retrievedAt`, `source: vexo_ble`, and kit-verified band number. Live vs prerecorded: band path is always live mic while blue LED is on.
