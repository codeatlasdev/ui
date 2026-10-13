<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  interface Props {
    value: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { value, disabled = false, class: className = '', children }: Props = $props();
</script>

<Tabs.Trigger {value} {disabled} class="ca-tabs-trigger {className}">
  {@render children?.()}
</Tabs.Trigger>

<style>
  :global(.ca-tabs-trigger) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--ca-control-height-sm);
    padding: 0 var(--ca-space-3-5);
    border-radius: var(--ca-radius-pill);
    border: none;
    background: transparent;
    color: var(--ca-text-secondary);
    font-family: var(--ca-font-sans);
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-medium);
    cursor: pointer;
    white-space: nowrap;
    transition:
      background var(--ca-duration-fast) var(--ca-ease-standard),
      color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-tabs-trigger:hover:not([disabled])) {
    color: var(--ca-text-primary);
    background: var(--ca-action-hover);
  }

  :global(.ca-tabs-trigger[data-state='active']) {
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
  }

  :global(.ca-tabs-trigger[disabled]) {
    opacity: 0.45;
    cursor: not-allowed;
  }

  :global(.ca-tabs-trigger:focus-visible) {
    outline: var(--ca-border-width-focus) solid var(--ca-brand-main);
    outline-offset: var(--ca-border-width-focus);
  }

  @media (pointer: coarse) {
    :global(.ca-tabs-trigger) {
      height: auto;
      min-height: var(--ca-touch-target);
    }
  }
</style>
