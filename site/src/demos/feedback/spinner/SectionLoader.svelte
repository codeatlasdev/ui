<script lang="ts">
  import { Spinner, Card, Stack } from '@codeatlasdev/ui';
</script>

<Card material="glass" p="10" full>
  <Stack align="center" gap="3">
    <Spinner size={40} />
    <span class="text">Loading data…</span>
  </Stack>
</Card>

<style>
  .text { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
