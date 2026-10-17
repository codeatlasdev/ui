<script lang="ts">
  import { Button, TextField } from '@codeatlasdev/ui';

  let items = $state([{ name: 'Design review' }, { name: 'Ship 4.3' }]);
  let first = $state<HTMLInputElement | null>(null);
</script>

<div class="col">
  {#each items as item, i (i)}
    <TextField
      label="Task name"
      hideLabel
      bind:value={item.name}
      bind:ref={first}
      maxlength={40}
      autocomplete="off"
    />
  {/each}
  <Button size="sm" variant="text" onclick={() => first?.focus()}>Focus the last field</Button>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    width: 100%;
    max-width: 400px;
  }
</style>
