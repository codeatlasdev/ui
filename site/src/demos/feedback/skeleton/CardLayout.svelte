<script lang="ts">
  import { Skeleton, Card, Stack, Flex } from '@codeatlasdev/ui';
</script>

<Card material="glass" p="5" full>
  <Flex gap="4" align="start">
    <Skeleton variant="circular" width="48px" height="48px" />
    <Stack gap="2">
      <Skeleton height="16px" width="40%" />
      <Skeleton height="13px" width="70%" />
      <Skeleton height="13px" width="55%" />
    </Stack>
  </Flex>
</Card>
