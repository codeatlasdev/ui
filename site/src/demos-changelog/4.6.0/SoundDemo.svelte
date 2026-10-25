<script lang="ts">
  import { Button, Switch } from '@codeatlasdev/ui';
  import { SoundToggle } from '@codeatlasdev/ui/sound';

  let notify = $state(false);
</script>

<div class="col">
  <p class="label">Turn sound on, then press the buttons.</p>
  <div class="row">
    <SoundToggle volume />
    <Button sound>Save</Button>
    <Button variant="outlined" sound="success">Approve</Button>
    <Switch sound bind:checked={notify} label="Email me about releases" />
  </div>
  <p class="hint">Sound is off until you turn it on. Nothing plays before your first click or key press.</p>
</div>

<style>
  .col { display: grid; gap: var(--ca-space-3); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); }
  .label { margin: 0; color: var(--ca-text-primary); font-size: var(--ca-font-size-body1); }
  .hint { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
</style>
