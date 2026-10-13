<script lang="ts">
  import { Image } from '@codeatlasdev/ui';

  // A 4:3 placeholder, inlined so the demo needs no asset.
  const src =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#c47a15'/><stop offset='1' stop-color='#2b5fd9'/></linearGradient></defs><rect width='800' height='600' fill='url(#g)'/></svg>`
    );
</script>

<div style="max-width: 360px">
  <Image {src} alt="Gradient placeholder, 4 by 3" width={800} height={600} />
</div>
