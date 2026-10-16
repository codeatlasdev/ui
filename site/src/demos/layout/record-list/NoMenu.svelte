<script lang="ts">
  import { RecordCell, RecordList, RecordRow } from '@codeatlasdev/ui';

  const hooks = [
    { id: 1, url: 'https://example.com/hooks/orders', events: 'order.created', ok: '99.8%' },
    { id: 2, url: 'https://example.com/hooks/refunds', events: 'refund.created refund.failed', ok: '100%' },
  ];
</script>

<RecordList
  columns="minmax(0,2fr) minmax(0,1.4fr) 5rem"
  labels={['Endpoint', 'Events', 'Delivered']}
  aria-label="Webhooks"
>
  {#each hooks as hook (hook.id)}
    <RecordRow>
      {#snippet identity()}<code>{hook.url}</code>{/snippet}
      <RecordCell label="Events">{hook.events}</RecordCell>
      <RecordCell label="Delivered">{hook.ok}</RecordCell>
    </RecordRow>
  {/each}
</RecordList>

<style>
  code { font-size: var(--ca-font-size-caption); overflow-wrap: anywhere; }
</style>
