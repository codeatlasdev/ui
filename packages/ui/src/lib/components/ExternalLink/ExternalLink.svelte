<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { ExternalLink as ExternalIcon } from '@lucide/svelte';
  import { useT } from '../../i18n/state.svelte.js';
  const t = useT();

  /**
   * ExternalLink: a link that leaves the app, opened in a new tab.
   *
   * Always sets `target="_blank"` with `rel="noopener noreferrer"`, shows a trailing icon
   * (decorative, `aria-hidden`) and appends a visually hidden "(opens in a new tab)" to the
   * accessible name (WCAG 3.2.5 / G201), localised through the i18n catalog.
   *
   * Usage (works inside a table cell):
   *   <ExternalLink href={row.buyUrl}>Buy at registrar</ExternalLink>
   */
  interface Props extends Omit<HTMLAnchorAttributes, 'class' | 'children' | 'target' | 'rel' | 'href'> {
    href: string;
    /** Link text. */
    children: Snippet;
    /** Trailing arrow icon. The screen-reader hint stays either way. */
    showIcon?: boolean;
    class?: string;
  }

  let { href, children, showIcon = true, class: className = '', ...rest }: Props = $props();
</script>

<a {...rest} {href} target="_blank" rel="noopener noreferrer" class="ca-external-link {className}">
  {@render children()}
  <span class="ca-sr-only"> ({t().externalLink.newTab})</span>
  {#if showIcon}<ExternalIcon class="ca-external-link__icon" size={14} stroke-width={2} aria-hidden="true" />{/if}
</a>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-external-link {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      color: var(--ca-brand-text);
      text-decoration: underline;
      text-underline-offset: 0.2em;
      border-radius: var(--ca-radius-xs);
    }

    .ca-external-link:hover { text-decoration-thickness: 2px; }

    .ca-external-link :global(.ca-external-link__icon) { flex: none; }


    /* Touch: a 44px target without growing the text. */
    @media (pointer: coarse) {
      .ca-external-link { min-height: var(--ca-touch-target); }
    }
}
</style>
