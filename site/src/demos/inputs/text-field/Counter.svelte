<script lang="ts">
  import { TextField } from '@codeatlasdev/ui';

  let headline = $state('Quarterly report is ready for review');
  let code = $state('');
</script>

<div class="col">
  <TextField
    label="Headline"
    description="Shown on the card."
    bind:value={headline}
    maxlength={40}
    counter
  />
  <TextField label="Promo code" bind:value={code} maxlength={12} counter={{ warnAt: 0.75 }} />
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    width: 100%;
    max-width: 400px;
  }
</style>
