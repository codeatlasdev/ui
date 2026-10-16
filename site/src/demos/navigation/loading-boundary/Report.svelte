<script lang="ts">
  // The suspending child: `await` makes the nearest <svelte:boundary> wait.
  let { load }: { load: () => Promise<string[]> } = $props();
  const rows = $derived(await load());
</script>

<ul>
  {#each rows as row}
    <li>{row}</li>
  {/each}
</ul>
