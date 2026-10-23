<script lang="ts">
  import { Card, Checkbox } from '@codeatlasdev/ui';
</script>

<Card material="glass" title="Trending topics" headingLevel={3} gap="sm" class="stacked">
  <Checkbox label="Hacker News" />
  <Checkbox label="Product Hunt" />
  <Checkbox label="Lobsters" />
</Card>

<style>
  :global(.stacked) { max-width: 320px; width: 100%; }
</style>
