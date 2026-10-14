<script lang="ts">
  import { KpiCard, KpiGrid, GlassCard, StatusChip, PageShell, Grid, SimpleTable, UserCell, Button, Row } from '@codeatlasdev/ui';
  import { LineChart, PieChart } from '@codeatlasdev/ui/charts';
  import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight } from '@lucide/svelte';

  let { user }: { user: { name: string } | null } = $props();

  const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];
  const revenue  = [42000,51000,58000,63000,72000,80000,88000,95000,112000];
  const expenses = [31000,36000,42000,45000,51000,55000,60000,64000,71000];
  const fmt      = (v: number) => `$${(v / 1000).toFixed(0)}k`;

  const pieData = [
    { value: 38, name: 'Organic'  },
    { value: 24, name: 'Paid'     },
    { value: 19, name: 'Referral' },
    { value: 12, name: 'Direct'   },
    { value:  7, name: 'Other'    },
  ];

  const recent = [
    { name: 'Ana Lima',    email: 'ana@acme.com',   plan: 'Pro',  status: 'active',   joined: 'Sep 18' },
    { name: 'Carlos Melo', email: 'carlos@apex.io', plan: 'Free', status: 'active',   joined: 'Sep 17' },
    { name: 'Diana Kwan',  email: 'diana@nova.dev', plan: 'Team', status: 'inactive', joined: 'Sep 15' },
    { name: 'Eduardo S.',  email: 'edu@mesh.ai',    plan: 'Pro',  status: 'active',   joined: 'Sep 14' },
    { name: 'Fiona C.',    email: 'fi@relay.io',    plan: 'Team', status: 'active',   joined: 'Sep 12' },
  ];
</script>

<PageShell
  title="Good morning, {user?.name?.split(' ')[0] ?? 'there'}"
  description="Monday, September 22, 2026"
  maxWidth="1200px"
  gap={24}
>
  {#snippet actions()}
    <Button variant="ghost" size="sm">
      {#snippet leading()}<ArrowUpRight size={14} />{/snippet}
      Export
    </Button>
  {/snippet}

  <KpiGrid>
    <KpiCard title="Total Revenue"   value="$112k" trend={18.4} icon={DollarSign} />
    <KpiCard title="Active Users" value="24.8k" trend={12.1} icon={Users}      />
    <KpiCard title="Growth Rate"     value="34%"   trend={5.6}  icon={TrendingUp} />
    <KpiCard title="Uptime"          value="99.9%" trend={0.1}  icon={Activity}   />
  </KpiGrid>

  <Grid cols="2fr 1fr" gap={20}>
    <GlassCard title="Revenue vs Expenses">
      <LineChart
        series={[{ name: 'Revenue', data: revenue }, { name: 'Expenses', data: expenses }]}
        categories={months}
        valueFormatter={fmt}
        area
        height="260px"
      />
    </GlassCard>
    <GlassCard title="Traffic Sources">
      <PieChart data={pieData} donut centerLabel={{ value: '100%', label: 'Channels' }} height="260px" />
    </GlassCard>
  </Grid>

  <GlassCard title="Recent Signups" full>
    {#snippet headerActions()}
      <Button variant="ghost" size="sm" href="/templates/admin/users/">View all →</Button>
    {/snippet}
    <SimpleTable>
      <thead>
        <tr><th>User</th><th>Plan</th><th>Status</th><th>Joined</th></tr>
      </thead>
      <tbody>
        {#each recent as u}
          <tr>
            <td class="primary"><UserCell name={u.name} email={u.email} /></td>
            <td>{u.plan}</td>
            <td><StatusChip status={u.status === 'active' ? 'success' : 'neutral'} label={u.status === 'active' ? 'Active' : 'Inactive'} /></td>
            <td>{u.joined}</td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  </GlassCard>
</PageShell>
