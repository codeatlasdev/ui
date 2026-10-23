<script lang="ts">
  import { Button, IconButton, TextField } from '@codeatlasdev/ui';
  import { Check, Copy } from '@lucide/svelte';

  let copied = $state(false);
  let code = $state('');
</script>

{#snippet copyBtn()}
  <IconButton
    variant="text"
    size="sm"
    aria-label={copied ? 'Link copied' : 'Copy link'}
    onclick={() => { copied = true; }}
  >
    {#if copied}<Check size={14} />{:else}<Copy size={14} />{/if}
  </IconButton>
{/snippet}
{#snippet applyBtn()}
  <Button variant="ghost" size="sm" disabled={!code}>Apply</Button>
{/snippet}

<div class="col">
  <TextField label="Share link" readonly value="https://ca.dev/s/x7Qk" suffix={copyBtn} />
  <TextField label="Coupon code" placeholder="SPRING25" bind:value={code} suffix={applyBtn} />
</div>

<style>
  .col { display: grid; gap: var(--ca-space-4); width: 100%; max-width: 24rem; }
</style>
