<script lang="ts">
  import {
    Button, Card, Heading, KpiCard, KpiGrid, SimpleTable, StatusChip, UserCell,
  } from '@codeatlasdev/ui';
  import { BarChart, PieChart } from '@codeatlasdev/ui/charts';
  import { Activity, ArrowUpRight, DollarSign, TrendingUp, Users } from '@lucide/svelte';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenue = [42, 51, 58, 63, 72, 80, 88, 95, 112];
  const expenses = [31, 36, 42, 45, 51, 55, 60, 64, 71];
  const fmt = (v: number) => `$${v}k`;

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
      <BarChart series={[{ name: 'Revenue', data: revenue }, { name: 'Expenses', data: expenses }]} categories={months} valueFormatter={fmt} height="240px" />
    </Card>
    <Card title="Traffic sources" headingLevel={3}>
      <PieChart data={sources} donut centerLabel={{ value: '100%', label: 'All channels' }} height="240px" />
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
  @container ts-island (min-width: 720px) {
    .ts-dash__charts { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
  }
</style>
