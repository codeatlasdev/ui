<script lang="ts">
  import { Divider, Card, Stack } from '@codeatlasdev/ui';
</script>

<Card material="glass" p="6" full>
  <Stack gap="4">
    <p>Section A content</p>
    <Divider />
    <p>Section B content</p>
    <Divider />
    <p>Section C content</p>
  </Stack>
</Card>

<style>
  p { margin: 0; font-size: var(--ca-font-size-body1); color: var(--ca-text-secondary); }
</style>
