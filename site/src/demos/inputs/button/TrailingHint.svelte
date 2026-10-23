<script lang="ts">
  import { Button, Kbd } from '@codeatlasdev/ui';
</script>

<div class="row">
  <Button variant="outlined" tone="neutral" trailingHint>
    Next lead
    {#snippet trailing()}<Kbd>K</Kbd>{/snippet}
  </Button>
  <Button variant="outlined" tone="neutral" trailingHint>
    Snooze
    {#snippet trailing()}<Kbd>S</Kbd>{/snippet}
  </Button>
</div>

<style>
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); }
</style>
