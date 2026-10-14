<script lang="ts">
  import { PageShell, GlassCard, Grid, KpiCard, KpiGrid, Row, Button, Tabs, TabsList, TabsTrigger, TabsContent, Select, Chip, SimpleTable } from '@codeatlasdev/ui';
  import { BarChart, LineChart } from '@codeatlasdev/ui/charts';
  import { DollarSign, TrendingUp, Users, ShoppingCart, Download } from '@lucide/svelte';

  let period = $state('90d');
  const periodOpts = [
    { value: '30d',  label: 'Last 30 days'  },
    { value: '90d',  label: 'Last 90 days'  },
    { value: '6m',   label: 'Last 6 months' },
    { value: '1y',   label: 'Last year'     },
  ];

  const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];
  const revenue  = [42000, 51000, 58000, 63000, 72000, 80000, 88000, 95000, 112000];
  const expenses = [31000, 36000, 42000, 45000, 51000, 55000, 60000, 64000, 71000];
  const profit   = revenue.map((r, i) => r - expenses[i]);

  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;

  const channelData = [
    { name: 'Organic',  value: 38500 },
    { name: 'Paid',     value: 24100 },
    { name: 'Referral', value: 19200 },
    { name: 'Direct',   value: 12800 },
    { name: 'Email',    value: 9400  },
    { name: 'Social',   value: 6100  },
  ];

  const planData = [
    { name: 'Pro',   value: 58 },
    { name: 'Team',  value: 27 },
    { name: 'Free',  value: 15 },
  ];

  const conversionWeeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9'];
  const conversionRate  = [3.2, 3.8, 4.1, 3.9, 4.5, 4.8, 5.2, 5.0, 5.6];
  const fmtPct = (v: number) => `${v}%`;

  // Top pages table data
  const topPages = [
    { page: '/pricing',          visits: 18420, conv: '6.2%', bounce: '31%' },
    { page: '/features',         visits: 14230, conv: '3.8%', bounce: '44%' },
    { page: '/',                 visits: 12800, conv: '2.1%', bounce: '52%' },
    { page: '/docs/get-started', visits:  9540, conv: '4.5%', bounce: '28%' },
    { page: '/blog/launch',      visits:  7310, conv: '1.9%', bounce: '61%' },
  ];
</script>

<PageShell
  title="Reports"
  description="Performance overview · Sep 2026"
  maxWidth="1200px"
  gap={24}
>
  {#snippet actions()}
    <Row gap={8} align="center">
      <Select bind:value={period} options={periodOpts} />
      <Button variant="outlined" size="sm">
        {#snippet leading()}<Download size={14} />{/snippet}
        Export
      </Button>
    </Row>
  {/snippet}

  <!-- KPI row -->
  <KpiGrid>
    <KpiCard title="Total Revenue"   value="$112k"  trend={18.4} icon={DollarSign}   />
    <KpiCard title="Net Profit"      value="$41k"   trend={11.2} icon={TrendingUp}   />
    <KpiCard title="New Customers"   value="1,284"  trend={9.7}  icon={Users}        />
    <KpiCard title="Avg Order Value" value="$87.20" trend={4.3}  icon={ShoppingCart} />
  </KpiGrid>

  <!-- Revenue chart tabs -->
  <GlassCard full>
    <Tabs value="revenue">
      <div class="chart-header">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="revenue">
        <div class="chart-wrap">
          <LineChart
            series={[
              { name: 'Revenue',  data: revenue  },
              { name: 'Expenses', data: expenses },
            ]}
            categories={months}
            valueFormatter={fmt}
            area
            height="300px"
          />
        </div>
      </TabsContent>

      <TabsContent value="profit">
        <div class="chart-wrap">
          <BarChart
            series={[{ name: 'Net Profit', data: profit }]}
            categories={months}
            valueFormatter={fmt}
            height="300px"
          />
        </div>
      </TabsContent>

      <TabsContent value="conversion">
        <div class="chart-wrap">
          <LineChart
            series={[{ name: 'Conversion Rate', data: conversionRate }]}
            categories={conversionWeeks}
            valueFormatter={fmtPct}
            height="300px"
          />
        </div>
      </TabsContent>
    </Tabs>
  </GlassCard>

  <!-- Channel + Plan breakdown -->
  <Grid cols="1fr 1fr" gap={20}>
    <GlassCard title="Revenue by Channel">
      <BarChart
        series={[{ name: 'Revenue', data: channelData.map(d => d.value) }]}
        categories={channelData.map(d => d.name)}
        valueFormatter={fmt}
        horizontal
        height="260px"
      />
    </GlassCard>

    <GlassCard title="Plan Distribution">
      <div class="plan-bars">
        {#each planData as p}
          <div class="plan-row">
            <div class="plan-meta">
              <span class="plan-name">{p.name}</span>
              <span class="plan-pct">{p.value}%</span>
            </div>
            <div class="plan-track">
              <div class="ca-bar-fill" style="--bar-w:{p.value}%"></div>
            </div>
          </div>
        {/each}
      </div>
      <div class="plan-total">
        <span class="plan-total__label">Total MRR</span>
        <span class="plan-total__value">$48,200</span>
      </div>
    </GlassCard>
  </Grid>

  <!-- Top pages table -->
  <GlassCard title="Top Pages" flush full>
    {#snippet headerActions()}
      <Chip label="By conversions" size="sm" variant="brand" />
    {/snippet}
    <SimpleTable>
      <thead>
        <tr>
          <th>Page</th>
          <th class="num">Visits</th>
          <th class="num">Conv. Rate</th>
          <th class="num">Bounce</th>
        </tr>
      </thead>
      <tbody>
        {#each topPages as row}
          <tr>
            <td class="page-path"><code>{row.page}</code></td>
            <td class="num">{row.visits.toLocaleString()}</td>
            <td class="num conv">{row.conv}</td>
            <td class="num">{row.bounce}</td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  </GlassCard>
</PageShell>

<style>
  .chart-header {
    padding: 16px 20px 0;
  }

  .chart-wrap {
    padding: 16px 8px 8px;
  }

  /* Plan bars */
  .plan-bars {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .plan-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

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

  .plan-track {
    height: 8px;
    border-radius: 999px;
    background: var(--ca-action-hover);
    overflow: hidden;
  }

  /* bar-fill width driven by --bar-w CSS custom property */

  .plan-total {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--ca-outline-subtle);
  }

  .plan-total__label {
    font-size: 13px;
    color: var(--ca-text-secondary);
  }

  .plan-total__value {
    font-size: 15px;
    font-weight: 700;
    color: var(--ca-text-primary);
  }

  /* Table */
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
