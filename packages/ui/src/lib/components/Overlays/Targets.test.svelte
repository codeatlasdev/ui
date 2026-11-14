<script lang="ts">
  // #1056: small desktop targets (Breadcrumb link, clickable sm Chip, TextField frame) and a Tooltip whose
  // children are interactive.
  import Breadcrumb from '../Breadcrumb/Breadcrumb.svelte';
  import Chip from '../Chip/Chip.svelte';
  import TextField from '../TextField/TextField.svelte';
  import Tooltip from '../Tooltip/Tooltip.svelte';

  let { part }: { part: 'targets' | 'tooltip-button' | 'tooltip-text' } = $props();
</script>

{#if part === 'targets'}
  <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contacts', href: '/contacts' }, { label: 'Ana' }]} />
  <Chip label="Open" size="sm" onclick={() => {}} />
  <TextField label="Name" />
{:else if part === 'tooltip-button'}
  <Tooltip content="Edit">
    <button type="button">Edit</button>
  </Tooltip>
{:else}
  <Tooltip content="Help">Help</Tooltip>
{/if}
