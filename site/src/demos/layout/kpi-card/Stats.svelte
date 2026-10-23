<script lang="ts">
  import { Card, Stat } from '@codeatlasdev/ui';
</script>

<Card material="glass" title="This week" headingLevel={3} class="stats-card">
  <div class="row">
    <Stat label="Leads this week" value="128" hint="12 more than last week" />
    <Stat label="Reply rate" value="18" unit="%" trend={-2.4} hint="Goal: 25%" />
    <Stat label="Booked calls" value="9" trend={12.5} />
  </div>
</Card>

<style>
  :global(.stats-card) { width: 100%; max-width: 640px; }
  .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--ca-space-5); }
</style>
