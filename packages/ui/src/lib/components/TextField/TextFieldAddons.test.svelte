<script lang="ts">
  import { untrack } from 'svelte';
  import { Copy } from '@lucide/svelte';
  import IconButton from '../Button/IconButton.svelte';
  import Button from '../Button/Button.svelte';
  import TextField from './TextField.svelte';

  let {
    oncopy,
    onapply,
    initial = 'codeatlas',
    ...rest
  }: { oncopy?: () => void; onapply?: () => void; initial?: string; [key: string]: unknown } = $props();
  let value = $state(untrack(() => initial));
</script>

{#snippet copyBtn()}
  <IconButton variant="text" size="sm" aria-label="Copy address" onclick={oncopy}><Copy size={14} /></IconButton>
{/snippet}
{#snippet applyBtn()}
  <Button variant="ghost" size="sm" onclick={onapply}>Apply</Button>
{/snippet}

<TextField label="Website" prefix="https://" suffix=".com" bind:value {...rest} />
<TextField label="Share link" value="ca.dev/x" suffix={copyBtn} />
<TextField label="Coupon" prefix={applyBtn} placeholder="Code" />
<output data-testid="bound">{value}</output>
