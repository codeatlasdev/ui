<script lang="ts">
  import Button from '../Button/Button.svelte';
  import CenteredPage from './CenteredPage.svelte';

  let { brand = false, tall = false, wrapped = false, ...rest }: { brand?: boolean; tall?: boolean; wrapped?: boolean; [k: string]: unknown } = $props();
</script>

{#snippet page()}
<CenteredPage {...rest} brand={brand ? logo : undefined}>
  <h1>Join Acme</h1>
  <Button>Accept</Button>
  {#if tall}
    <div class="spacer"></div>
    <Button data-end>Decline</Button>
  {/if}
</CenteredPage>
{/snippet}

{#if wrapped}
  <main id="main" tabindex="-1">{@render page()}</main>
{:else}
  {@render page()}
{/if}

{#snippet logo()}
  {#if rest.brandLabel}<svg width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="10" /></svg>{:else}<span>Logo</span>{/if}
{/snippet}

<style>
  .spacer { height: 1600px; }
</style>
