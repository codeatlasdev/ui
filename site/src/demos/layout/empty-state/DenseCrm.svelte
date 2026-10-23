<script lang="ts">
  import { Avatar, Button, Card, EmptyState, SegmentedControl, TextArea, TextField } from '@codeatlasdev/ui';
  import { Inbox } from '@lucide/svelte';

  let view = $state('day');
  let note = $state('');
</script>

<div class="crm">
  <Card title="Activity" headingLevel={3}>
    <div class="who">
      <Avatar alt="Ana Lima" tone="neutral" size="sm" />
      <Avatar alt="Bruno Reis" tone="neutral" size="sm" />
      <SegmentedControl
        aria-label="View"
        size="sm"
        bind:value={view}
        items={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
      />
    </div>
    <TextField label="Contact" placeholder="Search contacts" />
    <TextArea label="Note" rows={1} placeholder="Add a note" bind:value={note} />
    <EmptyState bare icon={Inbox} title="No activity yet" description="Calls and visits show up here.">
      {#snippet actions()}<Button variant="outlined" tone="neutral" size="sm">Log a call</Button>{/snippet}
    </EmptyState>
  </Card>
</div>

<style>
  /* Component tokens only: no selector against a ca-* class, defaults untouched outside this wrapper. */
  .crm {
    --ca-avatar-sm-fallback-size: 0.6875rem;
    --ca-avatar-fallback-weight: 500;
    --ca-field-gap: var(--ca-space-1-5);
    --ca-field-label-leading: 1.25;
    --ca-ta-min-height: var(--ca-space-16);
    --ca-card-bg: var(--ca-surface-raised);
    --ca-card-radius: var(--ca-radius-md);
    --ca-card-border: var(--ca-border-width) solid var(--ca-outline-subtle);
    --ca-card-shadow: none;
    --ca-seg-item-padding-x: var(--ca-space-3);
    --ca-seg-item-font-size: var(--ca-font-size-caption);
    --ca-empty-title-size: var(--ca-font-size-body2);
    --ca-empty-title-weight: 500;
    max-width: calc(var(--ca-space-unit) * 100);
  }
  .who { display: flex; align-items: center; gap: var(--ca-space-2); margin-bottom: var(--ca-space-3); }
</style>
