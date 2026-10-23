<script lang="ts">
  import { TextField } from '@codeatlasdev/ui';
  import { Search } from '@lucide/svelte';

  let password = $state('');
</script>

<div class="col">
  <TextField label="Search" placeholder="Type to search…">
    {#snippet leading()}<Search size={16} stroke-width={2} />{/snippet}
  </TextField>
  <TextField label="Password" type="password" revealable placeholder="••••••••" bind:value={password} />
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    width: 100%;
    max-width: 400px;
  }
</style>
