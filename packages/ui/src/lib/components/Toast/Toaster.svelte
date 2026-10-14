<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { toast } from '../../stores/toast.svelte.js';
  import ToastItem from './ToastItem.svelte';
  const t = useT();
</script>

<div class="ca-toaster" role="region" aria-live="polite" aria-label={t().toast.region}>
  {#each toast.items as item (item.id)}
    <ToastItem {item} onclose={() => toast.remove(item.id)} />
  {/each}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-toaster {
      position: fixed;
      bottom: var(--ca-space-6);
      right: var(--ca-space-6);
      z-index: var(--ca-z-snackbar);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-2);
      pointer-events: none;
      max-width: 380px;
      width: calc(100vw - 2 * var(--ca-space-6));
    }
}
</style>
