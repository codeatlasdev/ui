<script lang="ts">
  import { Sheet, Button, Stack } from '@codeatlasdev/ui';
  import { Plus } from '@lucide/svelte';

  let open = $state(false);
  let swipe = $state(true);
</script>

<Button variant="outlined" onclick={() => ((swipe = true), (open = true))}>Sheet with footer</Button>
<Button variant="outlined" onclick={() => ((swipe = false), (open = true))}>Swipe disabled</Button>

<Sheet bind:open title="Sessions" swipeToDismiss={swipe} onclose={() => (open = false)}>
  <Stack gap="2">
    <p class="text">
      {swipe
        ? 'Drag the handle or the header down to dismiss.'
        : 'swipeToDismiss is false: use the close button, Escape or the overlay.'}
    </p>
  </Stack>
  {#snippet footer()}
    <Button variant="filled" onclick={() => (open = false)}>
      {#snippet leading()}<Plus size={15} />{/snippet}
      New session
    </Button>
  {/snippet}
</Sheet>

<style>
  .text { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
