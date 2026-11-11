<script lang="ts">
  import type { Snippet } from 'svelte';
  import SkipLink from '../SkipLink/SkipLink.svelte';

  /**
   * CenteredPage: a transactional page outside the app shell (invite, OAuth consent, magic-link landing,
   * notices): one narrow column centred both ways, with the landmark, skip link, `--ca-vh` height and
   * safe-area padding on all four sides. No brand is drawn unless the `brand` snippet is given.
   *
   *   <CenteredPage maxWidth="md">
   *     {#snippet brand()}<Logo />{/snippet}
   *     <Card>…</Card>
   *   </CenteredPage>
   */
  interface Props {
    /** Column width cap: `sm` 24rem, `md` 28rem (default), `lg` 36rem or any CSS length. */
    maxWidth?: 'sm' | 'md' | 'lg' | (string & {});
    /** Rendered above the column, linked to `brandHref`. The library draws no default logo. */
    brand?: Snippet;
    brandHref?: string;
    /** Accessible name of the brand link (a logo alone has none). */
    brandLabel?: string;
    /** `id` of the `<main>`, the target of the skip link. `null` renders a plain `div` and no skip link: the page owns `<main>`. */
    mainId?: string | null;
    /** `mesh` lets the style's page paint show through instead of the flat base surface. */
    surface?: 'base' | 'mesh';
    class?: string;
    children?: Snippet;
  }

  let {
    maxWidth = 'md',
    brand,
    brandHref = '/',
    brandLabel,
    mainId = 'main',
    surface = 'base',
    class: className = '',
    children,
  }: Props = $props();

  const WIDTHS = { sm: '24rem', md: '28rem', lg: '36rem' } as const;
  const width = $derived(maxWidth in WIDTHS ? WIDTHS[maxWidth as keyof typeof WIDTHS] : maxWidth);
</script>

{#snippet content()}
  {#if brand}
    <a class="ca-centered__brand" href={brandHref} aria-label={brandLabel}>{@render brand()}</a>
  {/if}
  <div class="ca-centered__column" style:--ca-centered-width={width}>{@render children?.()}</div>
{/snippet}

<!-- Default: the page's <main> landmark and skip target (focus is programmatic only).
     mainId={null}: a plain div, the page already owns <main>. -->
{#if mainId}
  <SkipLink href="#{mainId}" />
  <main class="ca-centered {className}" id={mainId} tabindex="-1" data-surface={surface}>
    {@render content()}
  </main>
{:else}
  <div class="ca-centered {className}" data-surface={surface}>
    {@render content()}
  </div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-6);
      min-height: var(--ca-vh);
      box-sizing: border-box;
      padding:
        max(var(--ca-space-5), var(--ca-safe-top))
        max(var(--ca-space-5), var(--ca-safe-right))
        max(var(--ca-space-5), var(--ca-safe-bottom))
        max(var(--ca-space-5), var(--ca-safe-left));
      background: var(--ca-surface-base);
    }
    .ca-centered[data-surface='mesh'] { background: transparent; }

    .ca-centered__brand {
      display: inline-flex;
      align-items: center;
      color: inherit;
      text-decoration: none;
    }

    .ca-centered__column {
      width: min(100%, var(--ca-centered-width));
      min-width: 0;
    }
}
</style>
