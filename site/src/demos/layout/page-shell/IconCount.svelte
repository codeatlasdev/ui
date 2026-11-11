<script lang="ts">
  import { PageShell, Card, Badge, Button } from '@codeatlasdev/ui';
  import { Handshake } from '@lucide/svelte';
</script>

<Card flush full>
  <PageShell title="Deals" description="Sales funnel" icon={Handshake} count={128}>
    {#snippet titleExtra()}<Badge tone="warning" subtle>3 overdue</Badge>{/snippet}
    {#snippet actions()}<Button variant="filled" size="sm">New deal</Button>{/snippet}

    <Card full>
      <p class="placeholder">Pipeline goes here</p>
    </Card>
  </PageShell>
</Card>

<style>
  .placeholder {
    margin: 0;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ca-text-hint);
  }
</style>
