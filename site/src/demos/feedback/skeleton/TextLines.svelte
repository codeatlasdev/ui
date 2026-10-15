<script lang="ts">
  import { Skeleton, Card, Stack } from '@codeatlasdev/ui';
</script>

<Card material="glass" p="5" full>
  <Stack gap="3">
    <Skeleton height="20px" width="60%" />
    <Skeleton rows={3} height="14px" />
  </Stack>
</Card>
