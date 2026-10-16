<script lang="ts">
  import { AudioPlayer } from '@codeatlasdev/ui';

  // A 2 s mono 8 kHz tone, built in the browser so the demo needs no asset.
  function tone(seconds: number) {
    const rate = 8000;
    const n = rate * seconds;
    const buf = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o: number, s: string) => [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); buf.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
    buf.setUint32(24, rate, true); buf.setUint32(28, rate * 2, true); buf.setUint16(32, 2, true);
    buf.setUint16(34, 16, true); w(36, 'data'); buf.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) buf.setInt16(44 + i * 2, Math.sin((i / rate) * 2 * Math.PI * 440) * 3000, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }

  const src = tone(2);
  const peaks = Array.from({ length: 48 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i / 3)));
</script>

<div class="stack">
  <AudioPlayer {src} {peaks} duration={2} />
  <AudioPlayer {src} duration={2} label="Without waveform data" />
</div>

<style>
  .stack { display: flex; flex-direction: column; gap: var(--ca-space-3); max-inline-size: 24rem; }
</style>
