<script lang="ts">
  import { Image } from '@codeatlasdev/ui';

  const svg = (w: number, h: number, c: string) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='${w}' height='${h}' fill='${c}'/></svg>`);
  const small = svg(400, 225, '#2b5fd9');
  const large = svg(800, 450, '#1a7a50');
</script>

<div style="max-width: 420px">
  <Image
    src={large}
    srcset={`${small} 400w, ${large} 800w`}
    sizes="(min-width: 768px) 420px, 100vw"
    alt="Two renditions of the same 16 by 9 picture"
    width={800}
    height={450}
  />
</div>
