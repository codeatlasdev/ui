<script lang="ts">
  import { NumberField, Stack } from '@codeatlasdev/ui';

  let qty = $state(1);
  let price = $state(9.99);
</script>

<Stack gap="4">
  <NumberField label="Quantity" bind:value={qty} min={0} max={99} />
  <NumberField label="Price" bind:value={price} min={0} step={0.01} />
</Stack>
