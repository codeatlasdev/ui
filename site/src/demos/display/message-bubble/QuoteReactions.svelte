<script lang="ts">
  import { MessageBubble } from '@codeatlasdev/ui';
</script>

<div class="thread">
  <MessageBubble
    direction="in"
    sender="Carlos"
    time="18:02"
    reactions={[{ emoji: '👍', count: 2, mine: true }, { emoji: '🎉' }]}
  >
    {#snippet quote()}
      <strong>You</strong>
      <span>Meeting moved to 3 pm</span>
    {/snippet}
    Perfect, see you there.
  </MessageBubble>
</div>

<style>
  .thread { max-inline-size: 32rem; padding-block-end: var(--ca-space-4); }
</style>
