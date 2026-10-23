<script lang="ts">
  import { Image } from '@codeatlasdev/ui';

  // A 4:3 file cropped into three boxes; inlined so the demo needs no asset.
  const src =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#c47a15'/><stop offset='1' stop-color='#2b5fd9'/></linearGradient></defs><rect width='800' height='600' fill='url(#g)'/><circle cx='400' cy='300' r='140' fill='#fff' fill-opacity='.35'/></svg>`
    );
</script>

<div class="row">
  <figure><Image {src} alt="Wide cover" width={800} height={600} ratio={16 / 9} /><figcaption>16 / 9</figcaption></figure>
  <figure><Image {src} alt="Square cover" width={800} height={600} ratio={1} /><figcaption>1</figcaption></figure>
  <figure><Image {src} alt="Contained" width={800} height={600} ratio={1} fit="contain" /><figcaption>1, contain</figcaption></figure>
</div>

<style>
  .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(8rem, 100%), 1fr)); gap: var(--ca-space-3); width: 100%; max-width: 32rem; }
  figure { margin: 0; }
  figcaption { margin-top: var(--ca-space-1); color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
</style>
