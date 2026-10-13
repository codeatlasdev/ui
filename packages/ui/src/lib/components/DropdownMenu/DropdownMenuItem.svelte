<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  interface Props {
    class?: string;
    onclick?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive';
    children?: Snippet;
  }

  let { class: className = '', onclick, disabled = false, variant = 'default', children }: Props = $props();
</script>

<DropdownMenu.Item
  class="ca-dropdown-item ca-dropdown-item--{variant} {className}"
  {disabled}
  onSelect={onclick}
>
  {@render children?.()}
</DropdownMenu.Item>

<style>
  :global(.ca-dropdown-item) {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2);
    height: var(--ca-control-height);
    padding: 0 var(--ca-space-3);
    border-radius: var(--ca-radius-sm);
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    cursor: pointer;
    outline: none;
    user-select: none;
  }
  :global(.ca-dropdown-item[data-highlighted]) {
    background: var(--ca-action-hover);
    color: var(--ca-text-primary);
  }
  :global(.ca-dropdown-item[data-disabled]) {
    color: var(--ca-text-disabled);
    cursor: default;
    pointer-events: none;
  }
  :global(.ca-dropdown-item--destructive) {
    color: var(--ca-semantic-error);
  }
  :global(.ca-dropdown-item--destructive[data-highlighted]) {
    background: color-mix(in oklab, var(--ca-semantic-error) 10%, transparent);
    color: color-mix(in oklab, var(--ca-semantic-error) 65%, black);
  }
</style>
