<script lang="ts">
  import { Grid, Box } from '@codeatlasdev/ui';
</script>

<Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: '2', md: '4' }} p="4">
  {#each [1, 2, 3, 4, 5, 6, 7, 8] as n (n)}
    <Box class="cell" p="4">{n}</Box>
  {/each}
</Grid>

<style>
  :global(.cell) { background: var(--ca-surface-raised); border-radius: var(--ca-radius-md); box-shadow: inset 0 0 0 1px var(--ca-outline-subtle); text-align: center; font-size: var(--ca-font-size-body2); }
</style>
