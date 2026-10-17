<script lang="ts">
  import { Tabs, TabsList, TabsTrigger } from '@codeatlasdev/ui';

  let view = $state('board');
</script>

<div class="wrap">
  <!-- View switcher: no TabsContent, so no aria-controls points at a missing panel. -->
  <Tabs bind:value={view} variant="line">
    <TabsList aria-label="View">
      <TabsTrigger value="board" data-testid="view-board">Board</TabsTrigger>
      <TabsTrigger value="list" data-testid="view-list">List</TabsTrigger>
      <TabsTrigger value="timeline" data-testid="view-timeline">Timeline</TabsTrigger>
    </TabsList>
  </Tabs>
  <p class="out">Showing the {view} view.</p>
</div>

<style>
  .wrap { width: 100%; max-width: 420px; }
  .out { margin: 16px 0 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>
