<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { avatar } from '../../i18n/groups/avatar.js';
  const t = useMessages(avatar);

  /**
   * Avatar: user identity display component.
   *
   * Sizes:   xs=20  sm=28  md=36  lg=48  xl=64  or any number (px)
   * Shapes:  circle (default) | rounded
   * Status:  online | offline | busy | away
   * Color:   auto-generated from name (consistent per person)
   *
   * <Avatar alt="Ana Lima" size="md" />
   * <Avatar alt="Ana Lima" size="md" status="online" />
   * <Avatar src="/photo.jpg" alt="Ana Lima" size="lg" shape="rounded" />
   * <Avatar alt="Ana Lima" decorative />   next to the visible name
   */

  type Size   = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  type Shape  = 'circle' | 'rounded';
  type Status = 'online' | 'offline' | 'busy' | 'away';
  type Tone   = 'palette' | 'neutral';

  interface Props {
    /** Image URL. Rendered as a real `<img>`; the fallback shows beneath it while it loads and after it fails. */
    src?:      string;
    alt?:      string;
    /** Initials override (string), or an icon/any content (Snippet). Otherwise initials derive from `alt`. */
    fallback?: string | Snippet;
    size?:     Size;
    shape?:    Shape;
    status?:   Status;
    /** Passed to the `<img>`. Use `"lazy"` in long lists. */
    loading?:        'lazy' | 'eager';
    /** Passed to the `<img>`, e.g. `"no-referrer"` for CDN photos that reject a cross-origin Referer. */
    referrerpolicy?: ReferrerPolicy;
    /** Passed to the `<img>`. */
    crossorigin?:    'anonymous' | 'use-credentials';
    /** Called when the image fails; the fallback shows. Use it to refetch a signed URL. */
    onerror?:        (event: Event) => void;
    /** Loading placeholder: same size, no image request, announced as busy. */
    skeleton?: boolean;
    /**
     * Fallback colour: `'palette'` (default) derives a colour from the name, so each person keeps theirs;
     * `'neutral'` draws every fallback the same, on `--ca-surface-overlay` with `--ca-text-secondary` and a
     * hairline ring, for a dense list where coloured discs compete with the content.
     */
    tone?:     Tone;
    /**
     * The avatar repeats a name that is already visible next to it: hidden from assistive tech
     * (no name, no image role, no status label) so a screen reader does not say the name twice.
     */
    decorative?: boolean;
    class?:    string;
  }

  const SIZES: Record<string, number> = { xs: 20, sm: 28, md: 36, lg: 48, xl: 64 };

  const PALETTES = [
    { bg: 'oklch(0.88 0.08 250)', fg: 'oklch(0.38 0.14 250)' }, // blue
    { bg: 'oklch(0.88 0.08 160)', fg: 'oklch(0.38 0.14 160)' }, // teal
    { bg: 'oklch(0.88 0.08 300)', fg: 'oklch(0.38 0.14 300)' }, // purple
    { bg: 'oklch(0.88 0.08 40)',  fg: 'oklch(0.42 0.14 40)'  }, // amber
    { bg: 'oklch(0.88 0.08 20)',  fg: 'oklch(0.42 0.16 20)'  }, // rose
    { bg: 'oklch(0.88 0.08 130)', fg: 'oklch(0.38 0.14 130)' }, // green
    { bg: 'oklch(0.88 0.08 200)', fg: 'oklch(0.38 0.12 200)' }, // cyan
    { bg: 'oklch(0.88 0.08 330)', fg: 'oklch(0.38 0.14 330)' }, // pink
  ];

  function hashName(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
    return h;
  }

  function getInitials(alt: string, fallback?: string): string {
    const base = (fallback ?? alt).trim();
    if (!base) return '?';
    const words = base.split(/\s+/);
    return words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  let {
    src,
    alt       = '',
    fallback,
    size      = 'md',
    shape     = 'circle',
    status,
    loading,
    referrerpolicy,
    crossorigin,
    onerror,
    skeleton = false,
    tone     = 'palette',
    decorative = false,
    class: className = '',
  }: Props = $props();

  const px       = $derived(typeof size === 'number' ? size : (SIZES[size] ?? 36));
  const text     = $derived(typeof fallback === 'string' ? fallback : undefined);
  const initials = $derived(getInitials(alt, text));
  const palette  = $derived(PALETTES[hashName((text ?? alt).trim()) % PALETTES.length]);
  const fontSize = $derived(Math.round(px * (initials.length > 1 ? 0.36 : 0.42)));
  const radius   = $derived(shape === 'rounded' ? `${Math.round(px * 0.22)}px` : '50%');
  const dotSize  = $derived(Math.max(6, Math.round(px * 0.26)));

  // `failed` is keyed on the src it failed for, so a new src gets a fresh attempt.
  let failedSrc = $state<string | undefined>();
  let loadedSrc = $state<string | undefined>();
  const showImg = $derived(!skeleton && !!src && failedSrc !== src);
  const covered = $derived(showImg && loadedSrc === src);

  function handleError(e: Event) {
    failedSrc = src;
    onerror?.(e);
  }
</script>

<span
  class="ca-avatar {className}"
  data-tone={tone === 'neutral' ? 'neutral' : undefined}
  data-size={typeof size === 'string' ? size : undefined}
  data-skeleton={skeleton ? '' : undefined}
  aria-busy={skeleton ? 'true' : undefined}
  aria-hidden={decorative ? 'true' : undefined}
  style="--av-size:{px}px;--av-radius:{radius};{tone === 'neutral' ? '' : `--av-bg:${palette.bg};--av-fg:${palette.fg};`}--av-fs:{fontSize}px;--av-dot:{dotSize}px;"
>
  <!-- The fallback is always rendered beneath the <img>, so a slow or failed load never changes the box. -->
  <span class="ca-avatar__fallback" class:ca-avatar__fallback--covered={covered} aria-hidden={covered ? 'true' : undefined}>
    {#if typeof fallback === 'function'}
      {@render fallback()}
    {:else}
      {initials}
    {/if}
  </span>
  {#if showImg}
    <img
      {src}
      alt={decorative ? '' : alt}
      {loading}
      {referrerpolicy}
      {crossorigin}
      class="ca-avatar__img"
      onload={() => (loadedSrc = src)}
      onerror={handleError}
    />
  {/if}

  {#if status}
    <span
      class="ca-avatar__status ca-avatar__status--{status}"
      aria-label={decorative ? undefined : t().avatar.status[status]}
      role={decorative ? undefined : 'img'}
    ></span>
  {/if}
</span>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-avatar) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width:      var(--av-size);
      height:     var(--av-size);
      min-width:  var(--av-size);
      min-height: var(--av-size);
      border-radius: var(--av-radius);
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
    }

    :global(.ca-avatar__img) {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }

    /* Hidden (not removed) once the photo painted, so a transparent PNG never shows initials through it. */
    :global(.ca-avatar__fallback--covered) { visibility: hidden; }

    :global(.ca-avatar__fallback) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      background: var(--ca-avatar-fallback-bg, var(--av-bg));
      color: var(--ca-avatar-fallback-color, var(--av-fg));
      font-size: var(--ca-avatar-fallback-size, var(--av-fs));
      font-weight: var(--ca-avatar-fallback-weight, var(--ca-font-weight-semibold));
      letter-spacing: var(--ca-heading-tracking);
      line-height: 1;
      user-select: none;
    }

    /* Neutral tone: one fallback for everyone, from neutral tokens, never the name palette (the
       palette is not emitted inline for it). The hairline is an inset ring on the fallback, so it
       adds no layout shift and sits under a loaded photo. */
    :global(.ca-avatar[data-tone='neutral']) {
      --av-bg: var(--ca-surface-overlay);
      --av-fg: var(--ca-text-secondary);
    }
    :global(.ca-avatar[data-tone='neutral'] .ca-avatar__fallback) {
      box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
    }

    /* Per avatar size, --ca-avatar-<xs|sm|md|lg|xl>-fallback-{size,weight} beat the all-sizes token. */
    :global(.ca-avatar[data-size='xs'] .ca-avatar__fallback) { font-size: var(--ca-avatar-xs-fallback-size, var(--ca-avatar-fallback-size, var(--av-fs))); font-weight: var(--ca-avatar-xs-fallback-weight, var(--ca-avatar-fallback-weight, var(--ca-font-weight-semibold))); }
    :global(.ca-avatar[data-size='sm'] .ca-avatar__fallback) { font-size: var(--ca-avatar-sm-fallback-size, var(--ca-avatar-fallback-size, var(--av-fs))); font-weight: var(--ca-avatar-sm-fallback-weight, var(--ca-avatar-fallback-weight, var(--ca-font-weight-semibold))); }
    :global(.ca-avatar[data-size='md'] .ca-avatar__fallback) { font-size: var(--ca-avatar-md-fallback-size, var(--ca-avatar-fallback-size, var(--av-fs))); font-weight: var(--ca-avatar-md-fallback-weight, var(--ca-avatar-fallback-weight, var(--ca-font-weight-semibold))); }
    :global(.ca-avatar[data-size='lg'] .ca-avatar__fallback) { font-size: var(--ca-avatar-lg-fallback-size, var(--ca-avatar-fallback-size, var(--av-fs))); font-weight: var(--ca-avatar-lg-fallback-weight, var(--ca-avatar-fallback-weight, var(--ca-font-weight-semibold))); }
    :global(.ca-avatar[data-size='xl'] .ca-avatar__fallback) { font-size: var(--ca-avatar-xl-fallback-size, var(--ca-avatar-fallback-size, var(--av-fs))); font-weight: var(--ca-avatar-xl-fallback-weight, var(--ca-avatar-fallback-weight, var(--ca-font-weight-semibold))); }

    /* ── Status dot ─────────────────────────────────────────────── */
    :global(.ca-avatar__status) {
      position: absolute;
      bottom: 0;
      right: 0;
      width:  var(--av-dot);
      height: var(--av-dot);
      border-radius: 50%;
      border: var(--ca-border-width-strong) solid var(--ca-bg-body);
      box-sizing: content-box;
    }

    :global(.ca-avatar__status--online)  { background: var(--ca-semantic-success); }
    :global(.ca-avatar__status--offline) { background: var(--ca-outline-default); }
    :global(.ca-avatar__status--busy)    { background: var(--ca-semantic-error); }
    :global(.ca-avatar__status--away)    { background: var(--ca-semantic-warning); }
}
</style>


