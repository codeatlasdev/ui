<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Spinner from '../Spinner/Spinner.svelte';
  import { t } from '../../i18n/state.svelte.js';
  import { announce } from '../../utils/announce.js';
  import { devWarn } from '../../utils/dev-warn.js';

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
  .ca-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ca-radius-md);
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background var(--ca-duration-fast) var(--ca-ease-standard),
      color var(--ca-duration-fast) var(--ca-ease-standard),
      box-shadow var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-icon-btn:focus-visible {
    outline: 2px solid var(--ca-brand-main);
    outline-offset: 2px;
  }

  .ca-icon-btn:disabled,
  .ca-icon-btn[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.45;
    pointer-events: none;
  }

  .ca-icon-btn--loading:disabled,
  .ca-icon-btn--loading[aria-disabled='true'] {
    opacity: 1;
    cursor: progress;
  }
  .ca-icon-btn--loading :global(.ca-spinner__track) {
    stroke: color-mix(in oklab, currentColor 25%, transparent);
  }
  .ca-icon-btn--loading :global(.ca-spinner__arc) {
    stroke: currentColor;
  }

  /* Sizes */
  .ca-icon-btn--sm { width: 32px; height: 32px; }
  .ca-icon-btn--md { width: 40px; height: 40px; }
  .ca-icon-btn--lg { width: 48px; height: 48px; }

  @media (pointer: coarse) {
    .ca-icon-btn {
      min-width: var(--ca-touch-target);
      min-height: var(--ca-touch-target);
    }
  }

  /* Glass */
  .ca-icon-btn--glass {
    background: var(--ca-glass-tint);
    backdrop-filter: var(--ca-blur-regular);
    border: 1px solid var(--ca-glass-border);
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
</style>
