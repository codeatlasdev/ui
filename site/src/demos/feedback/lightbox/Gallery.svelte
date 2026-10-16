<script lang="ts">
  import { Button, Lightbox, type LightboxItem } from '@codeatlasdev/ui';

  const svg = (fill: string, shape: string) =>
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="${fill}"/>${shape}</svg>`
    );

  const items: LightboxItem[] = [
    {
      src: svg('#334155', '<circle cx="320" cy="200" r="90" fill="#94a3b8"/>'),
      alt: 'Gray circle on a dark background',
      caption: 'Moodboard, v1',
      meta: 'Maria, 10:42',
    },
    {
      type: 'video',
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      poster: svg('#0f766e', '<polygon points="280,140 280,260 380,200" fill="#99f6e4"/>'),
      alt: 'Flower blooming',
      caption: 'Short clip',
      meta: 'Bruno, 10:44',
    },
    {
      src: svg('#7c2d12', '<rect x="220" y="120" width="200" height="160" fill="#fdba74"/>'),
      alt: 'Orange square on a brown background',
      caption: 'Moodboard, v2',
    },
  ];

  let open = $state(false);
  let index = $state(0);
</script>

<Button variant="outlined" onclick={() => { index = 0; open = true; }}>Open gallery ({items.length})</Button>
<Lightbox bind:open bind:index {items} />
