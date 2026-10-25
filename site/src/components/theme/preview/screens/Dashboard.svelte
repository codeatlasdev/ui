<script lang="ts">
  import {
    Button, Card, Heading, KpiCard, KpiGrid, Progress, SimpleTable, StatusChip, UserCell,
  } from '@codeatlasdev/ui';
  import { Activity, ArrowUpRight, DollarSign, TrendingUp, Users } from '@lucide/svelte';

  // Canvas charts read the page's theme once, so they cannot follow a scoped island. These bars are
  // plain DOM painted from tokens: brand, radius, border and type all respond to the studio.
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenue = [42, 51, 58, 63, 72, 80, 88, 95, 112];
  const expenses = [31, 36, 42, 45, 51, 55, 60, 64, 71];
  const peak = Math.max(...revenue);

  const sources = [
    { value: 38, name: 'Organic' },
    { value: 24, name: 'Paid' },
    { value: 19, name: 'Referral' },
    { value: 12, name: 'Direct' },
    { value: 7, name: 'Other' },
  ];

  const recent = [
    { name: 'Ana Lima', email: 'ana@acme.com', plan: 'Pro', active: true, joined: 'Sep 18' },
    { name: 'Carlos Melo', email: 'carlos@apex.io', plan: 'Free', active: true, joined: 'Sep 17' },
    { name: 'Diana Kwan', email: 'diana@nova.dev', plan: 'Team', active: false, joined: 'Sep 15' },
    { name: 'Eduardo Silva', email: 'edu@mesh.ai', plan: 'Pro', active: true, joined: 'Sep 14' },
  ];
</script>

<section class="ts-dash" aria-label="Dashboard preview">
  <header class="ts-dash__head">
    <div>
      <Heading level={2} size="h3">Dashboard</Heading>
      <p class="ts-dash__date">Monday, September 22</p>
    </div>
    <Button variant="ghost" size="sm">
      {#snippet leading()}<ArrowUpRight size={14} />{/snippet}
      Export
    </Button>
  </header>

  <KpiGrid>
    <KpiCard title="Total revenue" value="$112k" trend={18.4} icon={DollarSign} />
    <KpiCard title="Active users" value="24.8k" trend={12.1} icon={Users} />
    <KpiCard title="Growth rate" value="34%" trend={5.6} icon={TrendingUp} />
    <KpiCard title="Uptime" value="99.9%" trend={0.1} icon={Activity} />
  </KpiGrid>

  <div class="ts-dash__charts">
    <Card title="Revenue vs expenses" headingLevel={3}>
      <div class="ts-bars" role="img" aria-label="Revenue and expenses by month, January to September, revenue rising from 42 to 112 thousand dollars">
        {#each months as m, i (m)}
          <div class="ts-bars__col">
            <div class="ts-bars__pair">
              <span class="ts-bar ts-bar--rev" style="--ts-h:{(revenue[i] / peak) * 100}%"></span>
              <span class="ts-bar ts-bar--exp" style="--ts-h:{(expenses[i] / peak) * 100}%"></span>
            </div>
            <span class="ts-bars__label">{m}</span>
          </div>
        {/each}
      </div>
      <p class="ts-legend"><span class="ts-key ts-key--rev"></span>Revenue <span class="ts-key ts-key--exp"></span>Expenses</p>
    </Card>
    <Card title="Traffic sources" headingLevel={3}>
      <div class="ts-sources">
        {#each sources as src (src.name)}
          <div class="ts-sources__row">
            <span class="ts-sources__name">{src.name}</span>
            <Progress value={src.value} max={40} label="{src.name} share" size="sm" />
            <span class="ts-sources__pct">{src.value}%</span>
          </div>
        {/each}
      </div>
    </Card>
  </div>

  <Card title="Recent signups" headingLevel={3} flush full>
    <SimpleTable>
      <thead><tr><th>User</th><th>Plan</th><th>Status</th><th>Joined</th></tr></thead>
      <tbody>
        {#each recent as u (u.email)}
          <tr>
            <td class="primary"><UserCell name={u.name} email={u.email} /></td>
            <td>{u.plan}</td>
            <td><StatusChip status={u.active ? 'success' : 'neutral'} label={u.active ? 'Active' : 'Inactive'} /></td>
            <td>{u.joined}</td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  </Card>
</section>

<style>
  .ts-dash {
    display: grid;
    gap: var(--ca-space-4);
    padding: var(--ca-space-4);
    min-width: 0;
  }
  .ts-dash__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-3);
    flex-wrap: wrap;
  }
  .ts-dash__date { margin: var(--ca-space-1) 0 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .ts-dash__charts { display: grid; gap: var(--ca-space-4); grid-template-columns: minmax(0, 1fr); min-width: 0; }
  .ts-bars { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: var(--ca-space-2); align-items: end; block-size: 11rem; }
  .ts-bars__col { display: grid; grid-template-rows: 1fr auto; gap: var(--ca-space-1); block-size: 100%; min-width: 0; }
  .ts-bars__pair { display: flex; align-items: end; gap: 2px; block-size: 100%; }
  .ts-bar { flex: 1; block-size: var(--ts-h); min-block-size: 2px; border-radius: var(--ca-radius-xs) var(--ca-radius-xs) 0 0; }
  .ts-bar--rev { background: var(--ca-brand-main); }
  .ts-bar--exp { background: var(--ca-outline-strong); }
  .ts-bars__label { text-align: center; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .ts-legend { display: flex; align-items: center; gap: var(--ca-space-2); margin: var(--ca-space-3) 0 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .ts-key { inline-size: var(--ca-space-3); block-size: var(--ca-space-3); border-radius: var(--ca-radius-xs); }
  .ts-key--rev { background: var(--ca-brand-main); }
  .ts-key--exp { background: var(--ca-outline-strong); margin-inline-start: var(--ca-space-2); }
  .ts-sources { display: grid; gap: var(--ca-space-3); }
  .ts-sources__row { display: grid; grid-template-columns: 5rem minmax(0, 1fr) 2.5rem; align-items: center; gap: var(--ca-space-2); font-size: var(--ca-font-size-body2); }
  .ts-sources__pct { text-align: end; font-variant-numeric: tabular-nums; color: var(--ca-text-secondary); }
  @container ts-island (min-width: 720px) {
    .ts-dash__charts { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
  }
</style>
