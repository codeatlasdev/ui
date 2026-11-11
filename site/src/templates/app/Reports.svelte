<script lang="ts">
  import { Flex } from '@codeatlasdev/ui';
  import ReportsScreen from '../_shared/ReportsScreen.svelte';
</script>

<ReportsScreen {planHeader} {topPagesHead} {topPagesRow} />

{#snippet planHeader(p: { name: string; value: number })}
  <Flex justify="between" class="plan-row__header">
    <span class="plan-name">{p.name}</span>
    <span class="plan-pct">{p.value}%</span>
  </Flex>
{/snippet}

{#snippet topPagesHead()}
  <th>Page</th><th class="num">Visits</th><th class="num">Conv.</th><th class="num">Bounce</th>
{/snippet}

{#snippet topPagesRow(r: { page: string; visits: number; conv: string; bounce: string })}
  <td><code class="page-code">{r.page}</code></td>
  <td class="num">{r.visits.toLocaleString()}</td>
  <td class="num conv">{r.conv}</td>
  <td class="num">{r.bounce}</td>
{/snippet}

<style>
  .plan-name  { font-size:13px; font-weight:500; color:var(--ca-text-primary); }
  .plan-pct   { font-size:13px; font-weight:600; color:var(--ca-text-secondary); }

  .num { text-align:right; }
  .page-code { font-size:12px; color:var(--ca-text-secondary); background:var(--ca-action-hover); padding:2px 6px; border-radius:var(--ca-radius-xs); font-family:ui-monospace,monospace; }
  .conv { color:var(--ca-semantic-success); font-weight:600; }
</style>
