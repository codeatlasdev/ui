<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    description?: string;
    class?: string;
    children?: Snippet; // the control (Switch, Button, etc.)
  }

  let { label, description, class: className = '', children }: Props = $props();
</script>

<!-- A wrapping <label> names the first labelable control inside (Switch, input,
     select, button) and makes the text clickable, with no id plumbing. -->
<label class="ca-setting-item {className}">
  <span class="ca-setting-item__text">
    <span class="ca-setting-item__label">{label}</span>
    {#if description}
      <span class="ca-setting-item__desc">{description}</span>
    {/if}
  </span>
  {#if children}
    <span class="ca-setting-item__control">
      {@render children()}
    </span>
  {/if}
</label>

<style>
  .ca-setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-4);
    padding: var(--ca-space-3) 0;
    min-height: var(--ca-space-12);
    cursor: default;
  }
  .ca-setting-item__text {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1);
    flex: 1;
    min-width: 0;
  }
  .ca-setting-item__label {
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
  }
  .ca-setting-item__desc {
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    line-height: var(--ca-line-height-snug);
  }
  .ca-setting-item__control {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
</style>
