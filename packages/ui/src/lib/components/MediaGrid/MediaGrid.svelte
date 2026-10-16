<script lang="ts" module>
  export interface MediaGridItem {
    /** `image` (default), `video` or `document`. */
    type?: 'image' | 'video' | 'document';
    /** Full-size media, or the file to open for a document. */
    src: string;
    /** Smaller image shown in the tile. Defaults to `src` (images) or `poster` (videos). */
    thumb?: string;
    /** Image description. Also names the tile and the gallery dialog. */
    alt?: string;
    /** File or video name. Preferred over `alt` for the tile name. */
    title?: string;
    /** Gallery caption. */
    caption?: string;
    /** Secondary gallery line, e.g. sender and time. */
    meta?: string;
    /** Video length shown on the tile, already formatted (e.g. `0:42`). */
    duration?: string;
    /** Video poster, shown in the tile and the gallery. */
    poster?: string;
    /** Original file to download when it differs from `src`. */
    download?: string;
    /** File size shown on a document tile, already formatted (e.g. `2 MB`). */
    size?: string;
  }
</script>

<script lang="ts">
  import { FileText, ImageOff, Play } from '@lucide/svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import Lightbox, { type LightboxItem } from '../Lightbox/Lightbox.svelte';
  import Skeleton from '../Skeleton/Skeleton.svelte';
  const t = useT();

  /**
   * MediaGrid: the media tiles of a chat message (images, videos, documents).
   *
   * Images and videos open a Lightbox gallery at the tapped tile. Documents are plain download
   * links and are not part of the gallery. When there are more items than `maxVisible`, the last
   * visible tile shows "+N more" and opens the gallery at that item. Every tile reserves its box
   * up front (fixed aspect ratio), shows a Skeleton until its image loads and a "Could not load"
   * state when it fails, so the layout never shifts.
   *
   * Usage:
   *   <MediaGrid items={[{ src: full, thumb, alt: 'Beach' }, { type: 'document', src: pdf, title: 'Report.pdf', size: '2 MB' }]} />
   */
  interface Props {
    /** Tiles, in order. */
    items: MediaGridItem[];
    /** Tiles shown before the "+N more" overlay takes over the last one. */
    maxVisible?: number;
    /** Column count. Default: by item count (1, 2, or 2 with a wide first tile for exactly 3). */
    columns?: 1 | 2 | 3;
    /** Accessible name of the group. Defaults to the localised "Media". */
    label?: string;
    /** Called when a tile is activated (before the gallery opens). */
    onopen?: (index: number, item: MediaGridItem) => void;
    /** Called instead of the default `<a download>` when the user taps Download in the gallery. */
    ondownload?: (item: LightboxItem, index: number) => void;
    class?: string;
  }

  let {
    items,
    maxVisible = 4,
    columns,
    label,
    onopen,
    ondownload,
    class: className = '',
  }: Props = $props();

  const kind = (item: MediaGridItem) => item.type ?? 'image';

  const visible = $derived(items.slice(0, Math.max(1, maxVisible)));
  const rest = $derived(items.length - visible.length);
  const cols = $derived(columns ?? (visible.length === 1 ? 1 : 2));
  const wideFirst = $derived(columns === undefined && visible.length === 3);

  /** Gallery entries: everything except documents, with each item's original index. */
  const gallery = $derived(
    items.flatMap((item, at) =>
      kind(item) === 'document'
        ? []
        : [
            {
              at,
              item: {
                type: kind(item) as 'image' | 'video',
                src: item.src,
                alt: item.title ?? item.alt,
                caption: item.caption,
                meta: item.meta,
                poster: item.poster ?? item.thumb,
                download: item.download,
              } satisfies LightboxItem,
            },
          ]
    )
  );
  const lightboxItems = $derived(gallery.map((g) => g.item));

  let open = $state(false);
  let index = $state(0);

  /** `loading` until the image fires load; `failed` after an error. Keyed by tile index. */
  let status = $state<Record<number, 'loaded' | 'failed'>>({});

  function thumbOf(item: MediaGridItem) {
    return kind(item) === 'video' ? (item.thumb ?? item.poster) : (item.thumb ?? item.src);
  }

  function nameOf(item: MediaGridItem) {
    const type = kind(item);
    return item.title || item.alt || (type === 'video' ? t().mediaGrid.video : type === 'document' ? t().mediaGrid.document : t().mediaGrid.image);
  }

  /** Images that finished before hydration never fire `load` again. */
  function settle(i: number) {
    return (img: HTMLImageElement) => {
      if (img.complete) {
        if (img.naturalWidth > 0) status[i] = 'loaded';
        else status[i] = 'failed';
      }
    };
  }

  /** Accessible name = "Open {name}, n of total" plus any visible tile text (WCAG 2.5.3). */
  function labelOf(item: MediaGridItem, i: number, overflow: boolean) {
    const visibleText = [
      kind(item) === 'video' ? item.duration : undefined,
      overflow ? t().mediaGrid.moreCount(rest) : undefined,
      status[i] === 'failed' ? t().mediaGrid.failed : undefined,
    ].filter(Boolean);
    return [t().mediaGrid.open(nameOf(item), i + 1, items.length), ...visibleText].join('. ');
  }

  function activate(i: number, item: MediaGridItem) {
    onopen?.(i, item);
    if (kind(item) === 'document') return;
    const at = gallery.findIndex((g) => g.at === i);
    if (at < 0) return;
    index = at;
    open = true;
  }
</script>

<div
  class="ca-media-grid {className}"
  role="group"
  aria-label={label ?? t().mediaGrid.label}
>
  <div
    class="ca-media-grid__grid"
    class:ca-media-grid__grid--single={visible.length === 1}
    class:ca-media-grid__grid--wide={wideFirst}
    style="--ca-media-grid-cols:{cols}"
  >
    {#each visible as item, i (i)}
      {@const type = kind(item)}
      {@const thumb = thumbOf(item)}
      {@const state = status[i]}
      {@const overflow = rest > 0 && i === visible.length - 1}
      {#snippet body()}
        {#if type === 'document'}
          <span class="ca-media-grid__doc">
            <FileText size={28} stroke-width={1.75} aria-hidden="true" />
            <span class="ca-media-grid__doc-title">{item.title ?? nameOf(item)}</span>
            {#if item.size}<span class="ca-media-grid__doc-size">{item.size}</span>{/if}
          </span>
        {:else}
          {#if state !== 'failed' && thumb}
            <img
              class="ca-media-grid__img"
              class:ca-media-grid__img--hidden={state !== 'loaded'}
              src={thumb}
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
              {@attach settle(i)}
              onload={() => (status[i] = 'loaded')}
              onerror={() => (status[i] = 'failed')}
            />
          {/if}
          {#if !state && thumb}
            <Skeleton variant="rectangular" class="ca-media-grid__skeleton" />
          {/if}
          {#if state === 'failed' || !thumb}
            <span class="ca-media-grid__failed">
              <ImageOff size={24} stroke-width={1.75} aria-hidden="true" />
              <span>{t().mediaGrid.failed}</span>
            </span>
          {/if}
          {#if type === 'video'}
            <span class="ca-media-grid__play" aria-hidden="true"><Play size={20} stroke-width={2} fill="currentColor" /></span>
            {#if item.duration}<span class="ca-media-grid__duration">{item.duration}</span>{/if}
          {/if}
          {#if overflow}
            <span class="ca-media-grid__more">{t().mediaGrid.moreCount(rest)}</span>
          {/if}
        {/if}
      {/snippet}
      {#if type === 'document'}
        <a
          class="ca-media-grid__tile ca-media-grid__tile--document"
          href={item.download ?? item.src}
          download
          aria-label={t().mediaGrid.open(nameOf(item), i + 1, items.length)}
          onclick={() => onopen?.(i, item)}
        >
          {@render body()}
        </a>
      {:else}
        <button
          type="button"
          class="ca-media-grid__tile ca-media-grid__tile--{type}"
          data-loaded={state === 'loaded'}
          data-state={state ?? 'loading'}
          aria-label={labelOf(item, i, overflow)}
          disabled={type === 'image' && (state === 'failed' || !thumb)}
          onclick={() => activate(i, item)}
        >
          {@render body()}
        </button>
      {/if}
    {/each}
  </div>
</div>

{#if lightboxItems.length}
  <Lightbox bind:open bind:index items={lightboxItems} {ondownload} />
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-media-grid {
      display: block;
      inline-size: 100%;
      max-inline-size: 20rem;
      min-inline-size: 0;
    }

    .ca-media-grid__grid {
      display: grid;
      grid-template-columns: repeat(var(--ca-media-grid-cols), minmax(0, 1fr));
      gap: var(--ca-space-1);
    }

    .ca-media-grid__tile {
      position: relative;
      display: block;
      min-inline-size: var(--ca-touch-target);
      min-block-size: var(--ca-touch-target);
      aspect-ratio: 1;
      padding: 0;
      overflow: hidden;
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-md);
      background: var(--ca-surface-sunken);
      color: var(--ca-text-primary);
      font: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .ca-media-grid__grid--single .ca-media-grid__tile { aspect-ratio: 4 / 3; }
    .ca-media-grid__grid--wide .ca-media-grid__tile:first-child {
      grid-column: 1 / -1;
      aspect-ratio: 2 / 1;
    }
    .ca-media-grid__tile:disabled { cursor: default; }
    .ca-media-grid__tile:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: 2px;
    }

    .ca-media-grid__img {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
      transition: opacity var(--ca-duration-base) var(--ca-ease-standard);
    }
    .ca-media-grid__img--hidden { opacity: 0; }

    .ca-media-grid__tile :global(.ca-media-grid__skeleton) {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
    }

    .ca-media-grid__failed,
    .ca-media-grid__doc {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-1);
      padding: var(--ca-space-2);
      text-align: center;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }
    .ca-media-grid__doc-title {
      max-inline-size: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-body2);
    }

    .ca-media-grid__play {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 50%;
      transform: translate(-50%, -50%);
      display: grid;
      place-items: center;
      inline-size: 2.5rem;
      block-size: 2.5rem;
      border-radius: 50%;
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      box-shadow: var(--ca-shadow-md);
    }

    .ca-media-grid__duration {
      position: absolute;
      inset-block-end: var(--ca-space-1);
      inset-inline-end: var(--ca-space-1);
      padding: 0 var(--ca-space-1-5);
      border-radius: var(--ca-radius-sm);
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-caption);
      font-variant-numeric: tabular-nums;
    }

    .ca-media-grid__more {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-body1);
      font-weight: var(--ca-font-weight-semibold);
      opacity: 0.92;
    }

    @media (forced-colors: active) {
      .ca-media-grid__tile { border: 1px solid CanvasText; }
      .ca-media-grid__play,
      .ca-media-grid__duration,
      .ca-media-grid__more { border: 1px solid CanvasText; background: Canvas; color: CanvasText; opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ca-media-grid__img { transition: none; }
    }
}
</style>
