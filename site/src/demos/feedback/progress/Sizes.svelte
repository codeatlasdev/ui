<script lang="ts">
  import { Progress } from '@codeatlasdev/ui';
</script>

<div class="stack">
  <Progress value={60} size="sm" label="Small bar" />
  <Progress value={60} size="md" label="Medium bar" />
  <Progress value={60} label="Default bar" />
  <Progress indeterminate size="sm" label="Small indeterminate bar" />
</div>

<style>
  .stack { display: grid; gap: var(--ca-space-4); width: 100%; max-width: 360px; }
</style>
