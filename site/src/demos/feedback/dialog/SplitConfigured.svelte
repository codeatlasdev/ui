<script lang="ts">
  import { Dialog, Button, Stack } from '@codeatlasdev/ui';

  let open = $state(false);
</script>

<Button variant="filled" onclick={() => (open = true)}>Open lead</Button>

<Dialog
  bind:open
  title="Lead details"
  size="split"
  chromeless
  splitColumns="2fr 3fr"
  splitSize={{ width: 'min(66vw, 80rem)', height: 'min(88svh, 56rem)' }}
  fullscreenBelow="sm"
>
  <div class="map">Map</div>
  <div class="details">
    <Stack gap="3">
      <p class="name">Atlas Logistics</p>
      <Button variant="filled" onclick={() => (open = false)}>Close</Button>
    </Stack>
  </div>
</Dialog>

<style>
  .map {
    display: grid;
    place-items: center;
    min-height: 160px;
    background: color-mix(in oklab, var(--ca-brand-main) 12%, var(--ca-surface-overlay));
    color: var(--ca-text-secondary);
  }
  .details { padding: 24px; overflow-y: auto; }
  .name { margin: 0; color: var(--ca-text-primary); }
</style>
