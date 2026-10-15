<script lang="ts">
  import { Sheet, Button, Stack } from '@codeatlasdev/ui';

  let open = $state(false);
  const accounts = ['Account A', 'Account B', 'Account C', 'Account D', 'Account E', 'Account F', 'Account G', 'Account H'];
</script>

<Button variant="outlined" onclick={() => (open = true)}>Open sheet</Button>

<Sheet bind:open title="Switch session" description="Choose the active account">
  <Stack gap="1">
    {#each accounts as acc}
      <button class="item" onclick={() => (open = false)}>{acc}</button>
    {/each}
  </Stack>
</Sheet>

<style>
  .item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 9px 12px;
    background: transparent;
    border: none;
    border-radius: var(--ca-radius-md);
    font-size: var(--ca-font-size-body2);
    font-family: inherit;
    color: var(--ca-text-primary);
    cursor: pointer;
    text-align: left;
    transition: background var(--ca-duration-fast);
  }
  .item:hover { background: var(--ca-action-hover); }
</style>
