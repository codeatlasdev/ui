<script lang="ts">
  import { GlassAppBar, Button, IconButton, Avatar, Card } from '@codeatlasdev/ui';
  import { Menu } from '@lucide/svelte';
</script>

<Card material="glass" full flush>
  <GlassAppBar>
    <span class="title">Dashboard</span>
    {#snippet leading()}<IconButton aria-label="Open menu"><Menu size={20} /></IconButton>{/snippet}
    {#snippet trailing()}
      <Button size="sm" variant="filled">Upgrade</Button>
      <Avatar alt="Carlos M" size="sm" />
    {/snippet}
  </GlassAppBar>
</Card>

<style>
  .title { font-weight: 600; color: var(--ca-text-primary); }
</style>
