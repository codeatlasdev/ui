<script lang="ts">
  import ReportsScreen from '../_shared/ReportsScreen.svelte';
</script>

<ReportsScreen {planHeader} {topPagesHead} {topPagesRow} />

{#snippet planHeader(p: { name: string; value: number })}
  <div class="plan-meta">
    <span class="plan-name">{p.name}</span>
    <span class="plan-pct">{p.value}%</span>
  </div>
{/snippet}

{#snippet topPagesHead()}
  <th>Page</th>
  <th class="num">Visits</th>
  <th class="num">Conv. Rate</th>
  <th class="num">Bounce</th>
{/snippet}

{#snippet topPagesRow(row: { page: string; visits: number; conv: string; bounce: string })}
  <td class="page-path"><code>{row.page}</code></td>
  <td class="num">{row.visits.toLocaleString()}</td>
  <td class="num conv">{row.conv}</td>
  <td class="num">{row.bounce}</td>
{/snippet}

<style>
  .plan-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .plan-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--ca-text-primary);
  }

  .plan-pct {
    font-size: 13px;
    font-weight: 600;
    color: var(--ca-text-secondary);
  }

  .num {
    text-align: right;
  }

  .page-path code {
    font-size: 12px;
    color: var(--ca-text-secondary);
    background: var(--ca-action-hover);
    padding: 2px 6px;
    border-radius: var(--ca-radius-xs);
    font-family: ui-monospace, monospace;
  }

  .conv {
    color: var(--ca-semantic-success);
    font-weight: 600;
  }
</style>
