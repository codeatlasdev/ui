<script lang="ts">
  import { Button, Toolbar } from '@codeatlasdev/ui';

  const filters = ['All', 'Open', 'Won', 'Lost', 'Stalled', 'Archived', 'Mine', 'Unassigned'];
</script>

<Toolbar aria-label="Deal filters" overflow="scroll">
  {#each filters as label}
    <Button variant="outlined" tone="neutral" size="sm">{label}</Button>
  {/each}
</Toolbar>
