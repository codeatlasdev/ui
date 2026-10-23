<script lang="ts">
  import { ChevronDown, Bold, Italic } from '@lucide/svelte';
  import Button from '../Button/Button.svelte';
  import IconButton from '../Button/IconButton.svelte';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuItem from '../DropdownMenu/DropdownMenuItem.svelte';
  import ButtonGroup from './ButtonGroup.svelte';

  let { orientation, onsave, disabled = false }: { orientation?: 'horizontal' | 'vertical'; onsave?: () => void; disabled?: boolean } = $props();
</script>

<ButtonGroup aria-label="Document actions" {orientation}>
  <Button variant="outlined" onclick={onsave} {disabled}>Save</Button>
  <Button variant="outlined" {disabled}>Save as</Button>
  <DropdownMenu>
    {#snippet triggerChild(props)}
      <IconButton variant="outlined" aria-label="More save options" {disabled} {...props}><ChevronDown size={16} /></IconButton>
    {/snippet}
    <DropdownMenuItem>Save a copy</DropdownMenuItem>
    <DropdownMenuItem>Save as template</DropdownMenuItem>
  </DropdownMenu>
</ButtonGroup>

<ButtonGroup aria-label="Text style">
  <IconButton variant="filled" aria-label="Bold"><Bold size={16} /></IconButton>
  <IconButton variant="filled" aria-label="Italic"><Italic size={16} /></IconButton>
</ButtonGroup>
