<script lang="ts">
  import type { Snippet } from 'svelte';
  import SkipLink from '../SkipLink/SkipLink.svelte';

  /**
   * AuthLayout: two-column layout for authentication pages.
   *
   * Left column: dark background with a brand gradient, animated blobs,
   * logo and a `panel` slot for decorative content (quote, steps, etc.).
   *
   * Right column: light background, centers `children` (the form).
   *
   * Inside the `panel` slot, use the CSS vars defined here:
   *   --panel-text-primary   → oklch(1 0 0 / 0.95)
   *   --panel-text-secondary → oklch(1 0 0 / 0.60)
   *   --panel-text-tertiary  → oklch(1 0 0 / 0.35)
   *   --panel-surface        → oklch(1 0 0 / 0.10)
   *   --panel-surface-active → oklch(1 0 0 / 0.18)
   *   --panel-border         → oklch(1 0 0 / 0.14)
   *
   * Usage:
   *   <AuthLayout logoMark="CA" logoName="My App">   (or {#snippet brand()} for an SVG logo)
   *     {#snippet panel()}
   *       <blockquote class="quote">…</blockquote>
   *     {/snippet}
   *     <MyForm />
   *   </AuthLayout>
   */

  interface Props {
    /**
     * Replaces the whole logo (mark and name), e.g. an SVG wordmark. Pass
     * `logoName` as well to render a name next to it.
     */
    brand?:    Snippet;
    logoMark?: string;
    /** Name beside the mark. Defaults to "CodeAtlas UI" unless `brand` is set. */
    logoName?: string;
    logoHref?: string;
    /**
     * While the side panel is hidden, `true` shows a compact strip with the
     * brand above the form. A `header` snippet replaces the strip.
     */
    mobileBrand?: boolean;
    /** Side column content: a quote, steps, or (with `panelBleed`) a map or image. */
    panel?:    Snippet;
    /** Which side the panel sits on. */
    panelSide?: 'left' | 'right';
    /**
     * `true` fills the panel edge to edge with the `panel` snippet: no padding,
     * no logo, no decorative blobs. The panel sticks to the viewport height.
     */
    panelBleed?: boolean;
    /** Viewport width from which the panel shows: `md` 900px, `lg` 1200px. Below it only the form shows. */
    panelHidden?: 'md' | 'lg';
    /**
     * Bar across the top of the form column (logo, language switcher, CTA).
     * Sticks to the top with the safe-area inset and replaces the mobile brand strip.
     */
    header?:   Snippet;
    /** Horizontal alignment of the form: centered (default) or flush to the start. */
    align?:    'center' | 'start';
    /** Form column */
    children?: Snippet;
  }

  let {
    brand,
    logoMark = 'CA',
    logoName,
    logoHref = '/',
    mobileBrand = true,
    panel,
    panelSide = 'left',
    panelBleed = false,
    panelHidden = 'md',
    header,
    align = 'center',
    children,
  }: Props = $props();

  const name = $derived(logoName ?? (brand ? undefined : 'CodeAtlas UI'));

  // The panel is hidden with CSS from the first paint; once measured on the client it is also
  // unmounted while hidden, so a map, video or image inside it is never fetched on mobile.
  // Server and first render keep it mounted (desktop), so there is no hydration mismatch.
  let panelShown = $state(true);
  $effect(() => {
    const mq = matchMedia(`(min-width: ${panelHidden === 'lg' ? 1200 : 900}px)`);
    const sync = () => (panelShown = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });
</script>

<SkipLink />
<div class="ca-auth" class:ca-auth--right={panelSide === 'right'} data-panel-hidden={panelHidden}>
  <aside class="ca-auth__panel" class:ca-auth__panel--bleed={panelBleed}>
    {#if panelBleed}
      {#if panelShown}{@render panel?.()}{/if}
    {:else}
      <div class="ca-auth__panel-inner">
        <a href={logoHref} class="ca-auth__logo">
          {#if brand}
            {@render brand()}
          {:else}
            <div class="ca-auth__mark" aria-hidden="true">{logoMark}</div>
          {/if}
          {#if name}<span class="ca-auth__name">{name}</span>{/if}
        </a>

        {#if panel && panelShown}
          <div
            class="ca-auth__slot"
            style="
              --panel-text-primary:   oklch(1 0 0 / 0.95);
              --panel-text-secondary: oklch(1 0 0 / 0.60);
              --panel-text-tertiary:  oklch(1 0 0 / 0.35);
              --panel-surface:        oklch(1 0 0 / 0.10);
              --panel-surface-active: oklch(1 0 0 / 0.18);
              --panel-border:         oklch(1 0 0 / 0.14);
            "
          >
            {@render panel()}
          </div>
        {/if}

        <div class="ca-auth__blobs" aria-hidden="true">
          <div class="ca-auth__blob ca-auth__blob--a"></div>
          <div class="ca-auth__blob ca-auth__blob--b"></div>
          <div class="ca-auth__blob ca-auth__blob--c"></div>
        </div>
      </div>
    {/if}
  </aside>

  {#if header}
    <div class="ca-auth__col ca-auth__col--framed" class:ca-auth__col--start={align === 'start'}>
      <header class="ca-auth__header">{@render header()}</header>
      <main class="ca-auth__main" id="main" tabindex="-1">{@render children?.()}</main>
    </div>
  {:else}
    <main class="ca-auth__col" class:ca-auth__col--start={align === 'start'} id="main" tabindex="-1">
      {#if mobileBrand}
        <a href={logoHref} class="ca-auth__mobile-brand">
          {#if brand}
            {@render brand()}
          {:else}
            <div class="ca-auth__mobile-mark" aria-hidden="true">{logoMark}</div>
          {/if}
          {#if name}<span class="ca-auth__mobile-name">{name}</span>{/if}
        </a>
      {/if}
      {@render children?.()}
    </main>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-auth {
      display: flex;
      min-height: var(--ca-vh);
      background: var(--ca-surface-base);
    }

    /* ── Left column, always dark ──────────────────────── */
    .ca-auth__panel {
      flex: 0 0 44%;
      position: relative;
      overflow: hidden;
      background: linear-gradient(
        145deg,
        color-mix(in oklab, var(--ca-brand-main) 60%, oklch(0.10 0 0)) 0%,
        color-mix(in oklab, var(--ca-brand-main) 30%, oklch(0.08 0 0)) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Same selector as the rule above: a :global() override loses to the scoped class. */
    @media (max-width: 899.98px) {
      .ca-auth__panel { display: none; }
    }
    @media (max-width: 1199.98px) {
      .ca-auth[data-panel-hidden='lg'] .ca-auth__panel { display: none; }
    }

    /* Full-bleed panel: the slot fills it edge to edge and stays in view while the form scrolls. */
    .ca-auth__panel--bleed {
      position: sticky;
      top: 0;
      height: var(--ca-vh);
      align-self: flex-start;
      display: block;
    }
    .ca-auth__panel--bleed > :global(*) {
      width: 100%;
      height: 100%;
    }

    .ca-auth--right .ca-auth__panel { order: 2; }

    .ca-auth__panel-inner {
      position: relative;
      z-index: 1;
      padding: var(--ca-space-12);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-10);
      width: 100%;
      max-width: calc(var(--ca-space-unit) * 105);
    }

    /* ── Logo ─────────────────────────────────────────────────── */
    .ca-auth__logo {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2-5);
      text-decoration: none;
    }

    .ca-auth__mark {
      width: var(--ca-control-height);
      height: var(--ca-control-height);
      border-radius: var(--ca-radius-md);
      background: oklch(1 0 0 / 0.14);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--ca-font-weight-bold);
      font-size: var(--ca-font-size-body2);
      color: oklch(1 0 0 / 0.95);
      letter-spacing: var(--ca-heading-tracking);
      flex-shrink: 0;
    }

    .ca-auth__name {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-lg);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: oklch(1 0 0 / 0.90);
    }

    /* ── Slot: vars available to the decorative content ──────── */
    .ca-auth__slot {
      --panel-text-primary:   oklch(1 0 0 / 0.95);
      --panel-text-secondary: oklch(1 0 0 / 0.60);
      --panel-text-tertiary:  oklch(1 0 0 / 0.35);
      --panel-surface:        oklch(1 0 0 / 0.10);
      --panel-surface-active: oklch(1 0 0 / 0.18);
      --panel-border:         oklch(1 0 0 / 0.14);
    }

    /* ── Animated blobs ───────────────────────────────────────── */
    .ca-auth__blobs {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .ca-auth__blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(var(--ca-space-16));
      opacity: 0.18;
    }

    .ca-auth__blob--a {
      width: calc(var(--ca-space-unit) * 80); height: calc(var(--ca-space-unit) * 80);
      background: color-mix(in oklab, var(--ca-brand-main) 70%, oklch(0.90 0 0));
      top: calc(var(--ca-space-20) * -1); right: calc(var(--ca-space-20) * -1);
      animation: ca-auth-float calc(9s * var(--ca-motion-scale)) ease-in-out infinite;
    }
    .ca-auth__blob--b {
      width: calc(var(--ca-space-unit) * 60); height: calc(var(--ca-space-unit) * 60);
      background: color-mix(in oklch, var(--ca-brand-main) 50%, oklch(0.60 0.18 235));
      bottom: calc(var(--ca-space-unit) * 15); left: calc(var(--ca-space-unit) * -15);
      animation: ca-auth-float calc(12s * var(--ca-motion-scale)) ease-in-out infinite reverse;
    }
    .ca-auth__blob--c {
      width: calc(var(--ca-space-unit) * 45); height: calc(var(--ca-space-unit) * 45);
      background: color-mix(in oklch, var(--ca-brand-main) 40%, oklch(0.85 0.12 150));
      bottom: calc(var(--ca-space-10) * -1); right: calc(var(--ca-space-unit) * 15);
      animation: ca-auth-float calc(15s * var(--ca-motion-scale)) ease-in-out infinite 3s;
    }

    @keyframes ca-auth-float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(var(--ca-space-3), calc(var(--ca-space-5) * -1)) scale(1.04); }
      66%       { transform: translate(calc(var(--ca-space-2) * -1), var(--ca-space-2-5)) scale(0.97); }
    }

    /* ── Form column ────────────────────────────────────────── */
    .ca-auth__col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--ca-space-10) var(--ca-space-6);
      background: var(--ca-surface-base);
    }
    .ca-auth__col--start { align-items: flex-start; }

    /* Hairline between the columns (low contrast, not the strong outline). */
    .ca-auth__panel--bleed + .ca-auth__col { box-shadow: inset var(--ca-border-width) 0 0 var(--ca-outline-subtle); }
    .ca-auth--right .ca-auth__panel--bleed + .ca-auth__col { box-shadow: inset calc(var(--ca-border-width) * -1) 0 0 var(--ca-outline-subtle); }

    /* With a header the column frames a sticky bar above the centered form. */
    .ca-auth__col--framed {
      justify-content: flex-start;
      padding: 0;
    }
    .ca-auth__header {
      position: sticky;
      top: 0;
      z-index: var(--ca-z-sticky);
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-3);
      padding: calc(var(--ca-space-3) + var(--ca-safe-top)) max(var(--ca-space-6), var(--ca-safe-right)) var(--ca-space-3) max(var(--ca-space-6), var(--ca-safe-left));
      background: var(--ca-surface-base);
    }
    .ca-auth__main {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--ca-space-10) max(var(--ca-space-6), var(--ca-safe-right)) calc(var(--ca-space-10) + var(--ca-safe-bottom)) max(var(--ca-space-6), var(--ca-safe-left));
    }
    .ca-auth__main:focus { outline: none; }
    .ca-auth__col--start .ca-auth__main { align-items: flex-start; }

    /* ── Mobile brand strip (the side panel is hidden) ─── */
    .ca-auth__mobile-brand {
      display: none;
      align-items: center;
      gap: var(--ca-space-2);
      margin-bottom: var(--ca-space-6);
      text-decoration: none;
      color: var(--ca-text-primary);
    }

    .ca-auth__mobile-mark {
      width: var(--ca-space-8);
      height: var(--ca-space-8);
      border-radius: var(--ca-radius-sm);
      background: var(--ca-brand-main);
      color: var(--ca-brand-contrast, oklch(1 0 0));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--ca-font-weight-bold);
      font-size: var(--ca-font-size-caption);
      letter-spacing: var(--ca-heading-tracking);
      flex-shrink: 0;
    }

    .ca-auth__mobile-name {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-body1);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
    }

    /* Single column: safe-area padding and the brand strip, from the width the panel hides. */
    @media (max-width: 899.98px) {
      .ca-auth__col:not(.ca-auth__col--framed) {
        padding-top: calc(var(--ca-space-10) + var(--ca-safe-top));
        padding-bottom: calc(var(--ca-space-10) + var(--ca-safe-bottom));
        padding-left: max(var(--ca-space-6), var(--ca-safe-left));
        padding-right: max(var(--ca-space-6), var(--ca-safe-right));
      }
      .ca-auth__mobile-brand { display: flex; }
    }
    @media (max-width: 1199.98px) {
      .ca-auth[data-panel-hidden='lg'] .ca-auth__col:not(.ca-auth__col--framed) {
        padding-top: calc(var(--ca-space-10) + var(--ca-safe-top));
        padding-bottom: calc(var(--ca-space-10) + var(--ca-safe-bottom));
        padding-left: max(var(--ca-space-6), var(--ca-safe-left));
        padding-right: max(var(--ca-space-6), var(--ca-safe-right));
      }
      .ca-auth[data-panel-hidden='lg'] .ca-auth__mobile-brand { display: flex; }
    }

    /* ── Shared auth utility classes, available inside any AuthLayout slot ── */
    :global(.auth-quote) { margin: 0; max-width: calc(var(--ca-space-unit) * 95); }
    :global(.auth-quote__text) {
      font-size: var(--ca-font-size-xl); line-height: var(--ca-line-height-snug); font-weight: var(--ca-font-weight-medium);
      letter-spacing: var(--ca-heading-tracking); margin: 0;
      color: var(--panel-text-primary, oklch(1 0 0 / 0.95));
    }
    :global(.auth-quote__attr) {
      font-size: var(--ca-font-size-body2); margin-top: var(--ca-space-4);
      color: var(--panel-text-secondary, oklch(1 0 0 / 0.60));
    }
}
</style>
