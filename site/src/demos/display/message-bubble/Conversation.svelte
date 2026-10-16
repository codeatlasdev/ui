<script lang="ts">
  import { Avatar, MessageBubble } from '@codeatlasdev/ui';
</script>

<div class="thread">
  <MessageBubble direction="in" grouped="first" sender="Maria Souza" time="14:30">
    {#snippet avatar()}<Avatar alt="Maria Souza" size="sm" />{/snippet}
    Can you send the invoice for March?
  </MessageBubble>
  <MessageBubble direction="in" grouped="last" time="14:30">
    {#snippet avatar()}<Avatar alt="Maria Souza" size="sm" />{/snippet}
    I need it before the review.
  </MessageBubble>
  <MessageBubble direction="out" time="14:32" status="read">Sent it by email just now.</MessageBubble>
</div>

<style>
  .thread { display: flex; flex-direction: column; gap: var(--ca-space-1); max-inline-size: 32rem; }
</style>
