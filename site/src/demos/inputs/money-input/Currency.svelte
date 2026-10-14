<script lang="ts">
  import { MoneyInput } from '@codeatlasdev/ui/forms';

  let usd = $state(123456);
  let jpy = $state(1234);
  let eur = $state(123456);
</script>

<div class="col">
  <MoneyInput label="Price (USD, en-US)" currency="USD" locale="en-US" bind:value={usd} />
  <MoneyInput label="Price (JPY, no decimals)" currency="JPY" locale="en-US" bind:value={jpy} />
  <MoneyInput label="Preis (EUR, de-DE)" currency="EUR" locale="de-DE" bind:value={eur} />
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-2);
  }
</style>
