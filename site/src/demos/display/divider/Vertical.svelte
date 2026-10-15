<script lang="ts">
  import { Divider, Card, Flex } from '@codeatlasdev/ui';
</script>

<Card material="glass" p="6" full>
  <Flex gap="6" align="center">
    <p>Left</p>
    <Divider orientation="vertical" />
    <p>Center</p>
    <Divider orientation="vertical" />
    <p>Right</p>
  </Flex>
</Card>

<style>
  p { margin: 0; font-size: var(--ca-font-size-body1); color: var(--ca-text-secondary); }
</style>
