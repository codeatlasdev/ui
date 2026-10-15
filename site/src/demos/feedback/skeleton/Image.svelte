<script lang="ts">
  import { Skeleton, Card, Stack } from '@codeatlasdev/ui';
</script>

<Card material="glass" flush full>
  <Skeleton variant="rectangular" height="180px" />
  <div class="caption">
    <Stack gap="2">
      <Skeleton height="16px" width="50%" />
      <Skeleton height="13px" width="80%" />
    </Stack>
  </div>
</Card>

<style>
  .caption { padding: 16px; }
</style>
