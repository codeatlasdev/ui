<script lang="ts">
  import { TextField } from '@codeatlasdev/ui';

  let site = $state('acme');
  let price = $state('49');
</script>

<div class="col">
  <TextField label="Website" prefix="https://" suffix=".com" bind:value={site} description="Read with the label: https:// acme .com" />
  <TextField label="Price" prefix="$" suffix="USD" bind:value={price} inputmode="decimal" />
  <TextField label="Handle" prefix="@" size="sm" value="codeatlas" />
  <TextField label="Domain" suffix=".dev" error="Already taken" value="acme" />
  <TextField label="Disabled" prefix="https://" disabled value="locked" />
</div>

<style>
  .col { display: grid; gap: var(--ca-space-4); width: 100%; max-width: 24rem; }
</style>
