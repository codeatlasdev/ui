<script lang="ts">
  import { Avatar, ConversationItem } from '@codeatlasdev/ui';

  let active = $state('maria');
  const rows = [
    { id: 'maria', title: 'Maria Souza', time: '14:32', preview: 'Sent it by email just now.', unread: 3 },
    { id: 'team', title: 'Design team', time: '13:10', preview: 'Carlos: new mocks are up', pinned: true },
    { id: 'ops', title: 'Ops alerts', time: 'Mon', preview: 'Deploy finished', muted: true },
    { id: 'ana', title: 'Ana Lima', time: '09:00', preview: '', typing: true },
  ];
</script>

<div class="inbox">
  {#each rows as row}
    <ConversationItem
      title={row.title}
      time={row.time}
      preview={row.preview}
      unread={row.unread}
      pinned={row.pinned}
      muted={row.muted}
      typing={row.typing}
      active={active === row.id}
      onclick={() => (active = row.id)}
    >
      {#snippet avatar()}<Avatar alt={row.title} size="lg" />{/snippet}
    </ConversationItem>
  {/each}
</div>

<style>
  .inbox { max-inline-size: 26rem; display: flex; flex-direction: column; }
</style>
