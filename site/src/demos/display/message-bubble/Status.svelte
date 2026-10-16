<script lang="ts">
  import { MessageBubble } from '@codeatlasdev/ui';

  const states = ['pending', 'sent', 'delivered', 'read'] as const;
</script>

<div class="thread">
  {#each states as status}
    <MessageBubble direction="out" time="09:41" {status}>{status}</MessageBubble>
  {/each}
</div>

<style>
  .thread { display: flex; flex-direction: column; gap: var(--ca-space-2); max-inline-size: 32rem; }
</style>
