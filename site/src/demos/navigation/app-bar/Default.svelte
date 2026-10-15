<script lang="ts">
  import { GlassAppBar, IconButton, Avatar, Card } from '@codeatlasdev/ui';
  import { Search, Bell } from '@lucide/svelte';
</script>

<Card material="glass" full flush>
  <GlassAppBar>
    <span class="title">My Application</span>
    {#snippet trailing()}
      <IconButton aria-label="Search"><Search size={18} /></IconButton>
      <IconButton aria-label="Notifications"><Bell size={18} /></IconButton>
      <Avatar alt="Ada L" size="sm" />
    {/snippet}
  </GlassAppBar>
</Card>

<style>
  .title { font-weight: 600; color: var(--ca-text-primary); }
</style>
