<script lang="ts">
  // "Apply to site": this browser wears the style until you reset. Visitor-only: it writes the
  // Theme Studio's storage key and nothing else, never the published theme (see lib/visitor-theme.ts).
  import { announce, Button, type DesignStyleId } from '@codeatlasdev/ui';
  import { onMount } from 'svelte';
  import { appliedStyle, applyStyleToSite, resetSite } from '~/lib/visitor-theme';

  interface Props {
    id: DesignStyleId;
    name: string;
  }
  let { id, name }: Props = $props();

  let current = $state<DesignStyleId | null>(null);
  onMount(() => {
    current = appliedStyle();
  });

  const active = $derived(current === id);

  function apply() {
    applyStyleToSite(id);
    current = id;
    announce(`${name} applied to this browser`, 'polite');
  }
  function reset() {
    resetSite();
    current = null;
    announce('Site theme restored', 'polite');
  }
</script>

<div class="ap">
  <div class="ap__row">
    {#if active}
      <Button variant="outlined" onclick={reset}>Reset the site</Button>
    {:else}
      <Button onclick={apply}>Apply to this site</Button>
    {/if}
    <p class="ap__note">
      {#if active}
        This browser now wears {name}. Reset puts the site back as it ships.
      {:else if current}
        This browser wears another style from this site. Applying replaces it.
      {:else}
        Try it on every page of this site, only in this browser. Nothing is published or changed for anyone else.
      {/if}
    </p>
  </div>
</div>

<style>
  .ap__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3) var(--ca-space-4); }
  .ap__note { margin: 0; flex: 1 1 18rem; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>
