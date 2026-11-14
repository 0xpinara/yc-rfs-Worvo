/** Build a mono PCM16 WAV blob (Deepgram-friendly) from Int16 samples. */
export function pcm16ToWavBlob(samples: Int16Array, sampleRate: number): Blob {
  const dataSize = samples.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength));
  return new Blob([buffer], { type: "audio/wav" });
}
