<script lang="ts">
  import { AlertDialog, Button, TextField } from '@codeatlasdev/ui';
  import { Trash2 } from '@lucide/svelte';

  const key = 'PRJ-42';
  let open = $state(false);
  let typed = $state('');
  let deleted = $state(false);
</script>

<Button variant="destructive" onclick={() => { typed = ''; open = true; }}>
  {#snippet leading()}<Trash2 size={14} />{/snippet}
  Delete {key}
</Button>
{#if deleted}<span class="out" aria-live="polite">{key} deleted.</span>{/if}

<AlertDialog
  bind:open
  title="Delete {key}?"
  confirmLabel="Delete"
  cancelVariant="outlined"
  destructive
  confirmDisabled={typed !== key}
  confirmProps={{ 'data-testid': 'confirm-delete' }}
  onconfirm={() => (deleted = true)}
>
  {#snippet description()}This removes <strong>3 linked records</strong> too and cannot be undone.{/snippet}
  <TextField label="Type {key} to confirm" bind:value={typed} />
</AlertDialog>

<style>
  .out { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
