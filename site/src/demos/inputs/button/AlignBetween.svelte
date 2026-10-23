<script lang="ts">
  import { Button, Kbd } from '@codeatlasdev/ui';
</script>

<div class="grid">
  <Button variant="outlined" tone="neutral" align="between" fullWidth trailingHint>
    Open lead
    {#snippet trailing()}<Kbd>O</Kbd>{/snippet}
  </Button>
  <Button variant="outlined" tone="neutral" align="between" fullWidth trailingHint>
    Assign to me
    {#snippet trailing()}<Kbd>A</Kbd>{/snippet}
  </Button>
  <Button variant="outlined" tone="neutral" align="between" fullWidth loading trailingHint>
    Syncing
    {#snippet trailing()}<Kbd>R</Kbd>{/snippet}
  </Button>
</div>

<style>
  .grid { display: grid; gap: var(--ca-space-2); max-width: 20rem; }
</style>
