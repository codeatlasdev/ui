<script lang="ts">
  import { Chip, ChipRow } from '@codeatlasdev/ui';

  const filters = ['All', 'Unread', 'Groups', 'Archived', 'Starred', 'Muted', 'Mentions', 'Drafts'];
  let active = $state('All');
</script>

<div class="frame">
  <ChipRow label="Filter chats" fade>
    {#each filters as f (f)}
      <Chip label={f} selected={active === f} onclick={() => (active = f)} />
    {/each}
  </ChipRow>
</div>

<style>
  .frame { width: min(100%, 22rem); }
</style>
