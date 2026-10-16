<script lang="ts">
  import { MediaGrid, type MediaGridItem } from '@codeatlasdev/ui';

  // Inline SVG data URLs keep the demo offline and deterministic.
  const art = (hue: number, label: string) =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><rect width="480" height="480" fill="hsl(${hue} 55% 60%)"/><text x="240" y="260" font-size="64" text-anchor="middle" fill="white" font-family="sans-serif">${label}</text></svg>`
    )}`;

  const items: MediaGridItem[] = [
    { src: art(210, 'A'), alt: 'Beach' },
    { src: art(20, 'B'), alt: 'Market', caption: 'Saturday market' },
    { type: 'video', src: '', thumb: art(130, '▶'), alt: 'Clip', duration: '0:12' },
    { type: 'document', src: '#', title: 'invoice-0412.pdf', size: '84 KB' },
    { src: art(300, 'E'), alt: 'Dinner' },
    { src: art(60, 'F'), alt: 'Sunset' },
  ];
</script>

<div class="box"><MediaGrid {items} maxVisible={4} /></div>

<style>
  .box { max-inline-size: 22rem; }
</style>
