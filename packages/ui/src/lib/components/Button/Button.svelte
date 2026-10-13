<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Spinner from '../Spinner/Spinner.svelte';
  import { t } from '../../i18n/state.svelte.js';
  import { announce } from '../../utils/announce.js';

  type Variant = 'filled' | 'glass' | 'outlined' | 'ghost' | 'destructive';
  type Size = 'sm' | 'md' | 'lg';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'onclick'> {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    /** Shows a spinner in place of `leading`, sets `aria-busy` and blocks interaction. Label is kept. */
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    fullWidth?: boolean;
    href?: string;
    target?: string;
    class?: string;
    children?: Snippet;
    leading?: Snippet;
    trailing?: Snippet;
    onclick?: (e: MouseEvent) => void;
    'aria-label'?: string;
  }

  let {
    variant = 'filled',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    fullWidth = false,
    href,
    target,
    class: className = '',
    children,
    leading,
    trailing,
    onclick,
    'aria-label': ariaLabel,
    ...rest
  }: Props = $props();

  const isDisabled = $derived(disabled || loading);

  // Tell assistive tech when the busy state ends (aria-busy alone is not announced on change).
  let wasLoading = false;
  $effect(() => {
    if (wasLoading && !loading) announce(t().button.loaded);
    wasLoading = loading;
  });
  const spinnerSize = $derived(size === 'lg' ? 18 : size === 'md' ? 16 : 14);
</script>

{#snippet leadingSlot()}
  {#if loading}
    <span class="ca-btn__leading" aria-hidden="true"><Spinner size={spinnerSize} /></span>
  {:else if leading}
    <span class="ca-btn__leading" aria-hidden="true">{@render leading()}</span>
  {/if}
{/snippet}

{#if href}
  <a
    {...rest}
    {href}
    {target}
    rel={target === '_blank' ? 'noopener noreferrer' : undefined}
    class="ca-btn ca-btn--{variant} ca-btn--{size} {className}"
    class:ca-btn--full-width={fullWidth}
    class:ca-btn--loading={loading}
    aria-disabled={isDisabled}
    aria-busy={loading || undefined}
    tabindex={isDisabled ? -1 : undefined}
    aria-label={ariaLabel}
    onclick={isDisabled ? (e) => e.preventDefault() : onclick}
  >
    {@render leadingSlot()}
    {@render children?.()}
    {#if trailing}
      <span class="ca-btn__trailing" aria-hidden="true">{@render trailing()}</span>
    {/if}
  </a>
{:else}
  <button
    {...rest}
    {type}
    disabled={isDisabled}
    class="ca-btn ca-btn--{variant} ca-btn--{size} {className}"
    class:ca-btn--full-width={fullWidth}
    class:ca-btn--loading={loading}
    aria-disabled={isDisabled}
    aria-busy={loading || undefined}
    {onclick}
    aria-label={ariaLabel}
  >
    {@render leadingSlot()}
    {@render children?.()}
    {#if trailing}
      <span class="ca-btn__trailing" aria-hidden="true">{@render trailing()}</span>
    {/if}
  </button>
{/if}

<style>
  .ca-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ca-space-1-5);
    border-radius: var(--ca-radius-control);
    border: none;
    cursor: pointer;
    font-family: var(--ca-font-sans);
    font-weight: var(--ca-font-weight-medium);
    letter-spacing: var(--ca-label-tracking);
    text-decoration: none;
    white-space: nowrap;
    transition:
      background var(--ca-duration-fast) var(--ca-ease-standard),
      color var(--ca-duration-fast) var(--ca-ease-standard),
      border-color var(--ca-duration-fast) var(--ca-ease-standard),
      box-shadow var(--ca-duration-fast) var(--ca-ease-standard),
      opacity var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-btn:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-brand-main);
    outline-offset: var(--ca-focus-ring-offset);
  }

  .ca-btn:disabled,
  .ca-btn[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.45;
    pointer-events: none;
  }

  /* Sizes: md aligns with TextField/Select height (--ca-control-height) */
  .ca-btn--sm {
    height: var(--ca-control-height-sm);
    padding: 0 var(--ca-space-2-5);
    font-size: var(--ca-font-size-body2);
  }
  .ca-btn--md {
    height: var(--ca-control-height);
    padding: 0 var(--ca-control-px);
    font-size: var(--ca-font-size-button);
  }
  .ca-btn--lg {
    height: var(--ca-control-height-lg);
    padding: 0 var(--ca-space-5);
    font-size: var(--ca-font-size-dialog);
  }

  /* Touch: every size reaches the 44px target (min-height wins over height). */
  @media (pointer: coarse) {
    .ca-btn { min-height: var(--ca-touch-target); }
    .ca-btn--lg { height: auto; }
  }

  /* Native-feeling press on touch devices. */
  @media (hover: none) and (prefers-reduced-motion: no-preference) {
    .ca-btn { transition-property: background, color, border-color, box-shadow, opacity, scale; }
    .ca-btn:active:not(:disabled) { scale: 0.97; transition-duration: var(--ca-duration-press); }
  }

  /* Filled */
  .ca-btn--filled {
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
  }
  .ca-btn--filled:hover:not(:disabled) {
    background: var(--ca-brand-fill-hover);
  }
  .ca-btn--filled:active:not(:disabled) {
    background: var(--ca-brand-fill-hover);
    box-shadow: inset 0 var(--ca-border-width) var(--ca-space-0-5) color-mix(in oklab, black 15%, transparent);
  }
  /* Disabled keeps the hue: the AA brand pair (fill + contrast text) at 0.45 opacity,
     never a desaturated grey. Hover/active are already gated by :not(:disabled). */
  .ca-btn--filled:disabled,
  .ca-btn--filled[aria-disabled='true'] {
    opacity: 0.45;
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    box-shadow: none;
  }

  /* Glass */
  .ca-btn--glass {
    background: var(--ca-glass-tint);
    -webkit-backdrop-filter: var(--ca-blur-regular);
    backdrop-filter: var(--ca-blur-regular);
    border: var(--ca-border-width) solid var(--ca-glass-border);
    color: var(--ca-text-primary);
    box-shadow: var(--ca-glass-shadow);
  }
  .ca-btn--glass:hover:not(:disabled) {
    background: var(--ca-glass-tint-thick);
  }

  /* Outlined */
  .ca-btn--outlined {
    background: transparent;
    border: var(--ca-border-width) solid var(--ca-brand-main);
    color: var(--ca-brand-text);
  }
  .ca-btn--outlined:hover:not(:disabled) {
    background: color-mix(in oklab, var(--ca-brand-main) 8%, transparent);
  }

  /* Ghost */
  .ca-btn--ghost {
    background: transparent;
    border: var(--ca-border-width) solid transparent;
    color: var(--ca-brand-text);
  }
  .ca-btn--ghost:hover:not(:disabled) {
    background: color-mix(in oklab, var(--ca-brand-main) 8%, transparent);
  }

  /* Destructive */
  .ca-btn--destructive {
    background: var(--ca-semantic-error-fill);
    color: var(--ca-on-semantic);
  }
  .ca-btn--destructive:hover:not(:disabled) {
    background: color-mix(in oklab, var(--ca-semantic-error-fill) 85%, black);
  }

  .ca-btn__leading,
  .ca-btn__trailing {
    display: flex;
    align-items: center;
  }

  /* Loading: keep full opacity (it is busy, not unavailable) and tint the spinner
     to the button's text color so it stays legible on every variant. */
  .ca-btn.ca-btn--loading:disabled,
  .ca-btn.ca-btn--loading[aria-disabled='true'] {
    opacity: 1;
    cursor: progress;
  }
  .ca-btn--loading :global(.ca-spinner__track) {
    stroke: color-mix(in oklab, currentColor 25%, transparent);
  }
  .ca-btn--loading :global(.ca-spinner__arc) {
    stroke: currentColor;
  }

  .ca-btn--full-width {
    width: 100%;
    justify-content: center;
  }
</style>
