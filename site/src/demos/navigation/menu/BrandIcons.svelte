<script lang="ts">
  import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, SchemeAsset, Button } from '@codeatlasdev/ui';
  import { Bot } from '@lucide/svelte';

  let last = $state('');
</script>

<DropdownMenu>
  {#snippet triggerChild(props)}
    <Button variant="glass" {...props}>New tab</Button>
  {/snippet}
  <DropdownMenuLabel>Agents</DropdownMenuLabel>
  <DropdownMenuItem onclick={() => (last = 'Shell')}>
    {#snippet icon()}<Bot />{/snippet}
    Shell
  </DropdownMenuItem>
  <!-- A brand mark keeps its own colors: brandIcon opts it out of the item's text color. -->
  <DropdownMenuItem brandIcon onclick={() => (last = 'Claude Code')}>
    {#snippet icon()}
      <svg viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#d97757" /><path d="M5 11 8 4l3 7" fill="none" stroke="#fff" stroke-width="1.6" /></svg>
    {/snippet}
    Claude Code
  </DropdownMenuItem>
  <!-- A monochrome mark needs a black asset on light and a white one on dark: SchemeAsset picks by the kit's scheme. -->
  <DropdownMenuItem brandIcon onclick={() => (last = 'Codex')}>
    {#snippet icon()}
      <SchemeAsset>
        {#snippet light()}<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#111" /></svg>{/snippet}
        {#snippet dark()}<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#fff" /></svg>{/snippet}
      </SchemeAsset>
    {/snippet}
    Codex
  </DropdownMenuItem>
  <DropdownMenuItem brandIcon disabled>
    {#snippet icon()}
      <svg viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#d97757" /></svg>
    {/snippet}
    Coming soon
  </DropdownMenuItem>
</DropdownMenu>

{#if last}<span class="note" aria-live="polite">Opened: {last}</span>{/if}

<style>
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
