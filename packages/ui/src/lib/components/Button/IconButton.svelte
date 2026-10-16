<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Spinner from '../Spinner/Spinner.svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import { announce } from '../../utils/announce.js';
  import { devWarn } from '../../utils/dev-warn.js';
  const t = useT();

  type Variant = 'glass' | 'filled' | 'text';
  type Size = 'sm' | 'md' | 'lg';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'onclick' | 'aria-label'> {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    /** Replaces the icon with a spinner, sets `aria-busy` and blocks interaction. */
    loading?: boolean;
    'aria-label': string;
    class?: string;
    children?: Snippet;
    onclick?: (e: MouseEvent) => void;
  }

  let {
    variant = 'glass',
    size = 'md',
    disabled = false,
    loading = false,
    'aria-label': ariaLabel,
    class: className = '',
    children,
    onclick,
    ...rest
  }: Props = $props();

  // Typed as required, but JS callers, spreads and MDX bypass the type: an icon-only button needs a name.
  $effect(() => {
    if (!ariaLabel?.trim() && !rest['aria-labelledby'])
      devWarn('icon-button-label', '<IconButton> has no accessible name. Pass aria-label (or aria-labelledby).');
  });

  const isDisabled = $derived(disabled || loading);

  // Tell assistive tech when the busy state ends (aria-busy alone is not announced on change).
  let wasLoading = false;
  $effect(() => {
    if (wasLoading && !loading) announce(t().button.loaded);
    wasLoading = loading;
  });
  const spinnerSize = $derived(size === 'lg' ? 22 : size === 'md' ? 18 : 16);
</script>

<button
  {...rest}
  type="button"
  disabled={isDisabled}
  aria-label={ariaLabel}
  class="ca-icon-btn ca-icon-btn--{variant} ca-icon-btn--{size} {className}"
  class:ca-icon-btn--loading={loading}
  aria-disabled={isDisabled}
  aria-busy={loading || undefined}
  {onclick}
>
  {#if loading}
    <Spinner size={spinnerSize} />
  {:else}
    {@render children?.()}
  {/if}
</button>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ca-radius-control);
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard),
        box-shadow var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-icon-btn:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    .ca-icon-btn:disabled,
    .ca-icon-btn[aria-disabled='true'] {
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Disabled from tokens, never opacity (the icon keeps a defined contrast). Loading is busy, not
       unavailable: it keeps its enabled look. Declared after the variants at the end of the block. */
    .ca-icon-btn--loading:disabled,
    .ca-icon-btn--loading[aria-disabled='true'] {
      cursor: progress;
    }
    .ca-icon-btn--loading :global(.ca-spinner__track) {
      stroke: color-mix(in oklab, currentColor 25%, transparent);
    }
    .ca-icon-btn--loading :global(.ca-spinner__arc) {
      stroke: currentColor;
    }

    /* Sizes */
    .ca-icon-btn--sm { width: var(--ca-space-8); height: var(--ca-space-8); }
    .ca-icon-btn--md { width: var(--ca-space-10); height: var(--ca-space-10); }
    .ca-icon-btn--lg { width: var(--ca-space-12); height: var(--ca-space-12); }

    @media (pointer: coarse) {
      .ca-icon-btn {
        min-width: var(--ca-touch-target);
        min-height: var(--ca-touch-target);
      }
    }

    /* Glass */
    .ca-icon-btn--glass {
      background: var(--ca-glass-tint);
      border: var(--ca-border-width) solid var(--ca-glass-border);
      color: var(--ca-text-primary);
      box-shadow: var(--ca-glass-shadow);
    }
    .ca-icon-btn--glass:hover:not(:disabled) {
      background: var(--ca-glass-tint-thick);
    }

    /* Filled */
    .ca-icon-btn--filled {
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
    }
    .ca-icon-btn--filled:hover:not(:disabled) {
      background: var(--ca-brand-fill-hover);
    }

    /* Text */
    .ca-icon-btn--text {
      background: transparent;
      color: var(--ca-text-secondary);
    }
    .ca-icon-btn--text:hover:not(:disabled) {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }

    /* Disabled look (not while loading): after the variants so it wins at equal specificity. */
    .ca-icon-btn:disabled:not(.ca-icon-btn--loading),
    .ca-icon-btn[aria-disabled='true']:not(.ca-icon-btn--loading) {
      color: var(--ca-text-disabled);
      box-shadow: none;
    }
    .ca-icon-btn--glass:disabled:not(.ca-icon-btn--loading),
    .ca-icon-btn--glass[aria-disabled='true']:not(.ca-icon-btn--loading),
    .ca-icon-btn--filled:disabled:not(.ca-icon-btn--loading),
    .ca-icon-btn--filled[aria-disabled='true']:not(.ca-icon-btn--loading) {
      background: var(--ca-action-disabled-bg);
      border: var(--ca-border-width) solid var(--ca-outline-default);
    }
    .ca-icon-btn--text:disabled:not(.ca-icon-btn--loading),
    .ca-icon-btn--text[aria-disabled='true']:not(.ca-icon-btn--loading) {
      background: transparent;
    }
}
</style>
