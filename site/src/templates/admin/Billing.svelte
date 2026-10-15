<script lang="ts">
  import {
    AppSettings, FormSection, Card, Grid, Flex, Button, KpiCard,
    StatusChip, Chip, SimpleTable,
  } from '@codeatlasdev/ui';
  import { CreditCard, Download, TrendingUp, DollarSign, Users, Zap, Layers, FileText } from '@lucide/svelte';

  const currentPlan = {
    name:     'Pro',
    price:    '$79',
    cycle:    'per month',
    nextBill: '22 out. 2026',
    features: ['Unlimited users', '100GB storage', 'Priority support', 'Advanced analytics'],
  };

  const invoices = [
    { id: 'INV-0024', date: '1 set. 2026', amount: '$79,00', status: 'paid' },
    { id: 'INV-0023', date: '1 ago. 2026', amount: '$79,00', status: 'paid' },
    { id: 'INV-0022', date: '1 jul. 2026', amount: '$79,00', status: 'paid' },
    { id: 'INV-0021', date: '1 jun. 2026', amount: '$79,00', status: 'paid' },
    { id: 'INV-0020', date: '1 mai. 2026', amount: '$79,00', status: 'paid' },
    { id: 'INV-0019', date: '1 abr. 2026', amount: '$59,00', status: 'paid' },
  ];

  const plans = [
    {
      name: 'Free', price: '$0', cycle: '/month', current: false,
      features: ['Up to 3 users', '5GB storage', 'Community support'],
    },
    {
      name: 'Pro', price: '$79', cycle: '/month', current: true,
      features: ['Unlimited users', '100GB storage', 'Priority support', 'Advanced analytics'],
    },
    {
      name: 'Team', price: '$199', cycle: '/month', current: false,
      features: ['Everything in Pro', '1TB storage', 'Dedicated account manager', 'Custom integrations', '99.9% SLA'],
    },
  ];

  const usage = [
    { label: 'Users',      used: 12,    limit: 'Unlimited', pct: undefined },
    { label: 'Armazenamento', used: 82,    limit: '100 GB',    pct: 82        },
    { label: 'Chamadas API',  used: 48500, limit: '100.000',   pct: 49        },
    { label: 'Deploys',       used: 23,    limit: '100',       pct: 23        },
  ];

  const TABS = [
    { value: 'overview', label: 'Overview', icon: CreditCard },
    { value: 'plans',    label: 'Plans',       icon: Layers     },
    { value: 'invoices', label: 'Invoices',      icon: FileText   },
  ];

  let tab = $state('overview');
</script>

<AppSettings
  title="Billing"
  description="Plan, usage and invoices."
  tabs={TABS}
  activeTab={tab}
  onTabChange={(t) => (tab = t)}
>
  {#snippet actions()}
    <Button variant="filled" size="sm">
      {#snippet leading()}<TrendingUp size={14} />{/snippet}
      Fazer upgrade
    </Button>
  {/snippet}

  <!-- OVERVIEW -->
  {#if tab === 'overview'}
    <Grid class="grid-auto-180" gap="4">
      <KpiCard title="Gasto mensal"   value="$79"  trend={0}    icon={DollarSign} />
      <KpiCard title="Active users" value="12"    trend={20.0} icon={Users}      />
      <KpiCard title="Armazenamento"  value="82 GB"  trend={8.5}  icon={Zap}        />
      <KpiCard title="Chamadas API"   value="48,5k"  trend={14.2} icon={TrendingUp} />
    </Grid>

    <FormSection title="Current plan" description="Your active plan and next charge." layout="stack">
      <div class="plan-hero">
        <div class="plan-hero__name">
          {currentPlan.name}
          <Chip label="Active" variant="success" size="sm" />
        </div>
        <div class="plan-hero__price">
          <span class="price-amount">{currentPlan.price}</span>
          <span class="price-cycle">{currentPlan.cycle}</span>
        </div>
        <p class="plan-next">Next charge: {currentPlan.nextBill}</p>
      </div>
      <ul class="plan-features">
        {#each currentPlan.features as f}
          <li class="plan-feature">
            <span class="plan-feature__dot"></span>
            {f}
          </li>
        {/each}
      </ul>
      <Flex gap="2">
        <Button variant="outlined" size="sm">Mudar plano</Button>
        <Button variant="ghost" size="sm" class="ca-btn-danger-ghost">Cancel plan</Button>
      </Flex>
    </FormSection>

    <FormSection title="Payment method" description="Card on file for charges." layout="stack">
      <div class="card-display">
        <div class="card-chip"></div>
        <p class="card-number">•••• •••• •••• 4242</p>
        <Flex justify="between">
          <div>
            <p class="card-meta-label">Titular</p>
            <p class="card-meta-value">Ana Lima</p>
          </div>
          <div>
            <p class="card-meta-label">Validade</p>
            <p class="card-meta-value">12 / 27</p>
          </div>
        </Flex>
      </div>
      <Flex gap="2">
        <Button variant="outlined" size="sm">
          {#snippet leading()}<CreditCard size={14} />{/snippet}
          Update card
        </Button>
      </Flex>
    </FormSection>

    <FormSection title="Usage this cycle" description="Consumption for the current period." layout="stack">
      <Grid columns={{ base: 1, md: 2 }} gap="5">
        {#each usage as u}
          <div class="usage-item">
            <div class="usage-header">
              <span class="usage-label">{u.label}</span>
              <span class="usage-value">
                {u.pct !== undefined
                  ? `${typeof u.used === 'number' ? u.used.toLocaleString('pt-BR') : u.used} / ${u.limit}`
                  : u.used}
              </span>
            </div>
            {#if u.pct !== undefined}
              <div class="usage-track">
                <div
                  class="ca-bar-fill"
                  class:ca-bar-fill--warn={u.pct > 80}
                  style="--bar-w:{u.pct}%"
                ></div>
              </div>
            {:else}
              <p class="usage-unlimited">Sem limite</p>
            {/if}
          </div>
        {/each}
      </Grid>
    </FormSection>
  {/if}

  <!-- PLANOS -->
  {#if tab === 'plans'}
    <FormSection title="Choose your plan" description="Upgrade or downgrade at any time." layout="stack">
      <Grid columns={{ base: 1, md: 3 }} gap="4">
        {#each plans as p}
          <Card material="glass" tone={p.current ? "brand" : "neutral"} p="6">
            <div class="pricing-card">
              <div class="pricing-name">
                {p.name}
                {#if p.current}<Chip label="Atual" variant="brand" size="sm" />{/if}
              </div>
              <div class="pricing-price">
                <span class="pricing-amount">{p.price}</span>
                <span class="pricing-cycle">{p.cycle}</span>
              </div>
              <ul class="pricing-features">
                {#each p.features as f}
                  <li class="pricing-feature">
                    <span class="pricing-check">✓</span>
                    {f}
                  </li>
                {/each}
              </ul>
              <Button
                variant={p.current ? 'outlined' : 'filled'}
                disabled={p.current}
              >
                {p.current ? 'Current plan' : `Upgrade to ${p.name}`}
              </Button>
            </div>
          </Card>
        {/each}
      </Grid>
    </FormSection>
  {/if}

  <!-- FATURAS -->
  {#if tab === 'invoices'}
    <Card material="glass" flush full>
      <SimpleTable>
        <thead>
          <tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {#each invoices as inv}
            <tr>
              <td class="inv-id">{inv.id}</td>
              <td>{inv.date}</td>
              <td class="inv-amount">{inv.amount}</td>
              <td>
                <StatusChip
                  status={inv.status === 'paid' ? 'success' : 'error'}
                  label={inv.status === 'paid' ? 'Pago' : 'Falhou'}
                />
              </td>
              <td>
                <Button variant="ghost" size="sm">
                  {#snippet leading()}<Download size={13} />{/snippet}
                  PDF
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </SimpleTable>
    </Card>
  {/if}
</AppSettings>

<style>
  :global(.grid-auto-180) { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
  /* Current plan */
  .plan-hero        { display: flex; flex-direction: column; gap: var(--ca-space-1, 4px); }
  .plan-hero__name  { display: flex; align-items: center; gap: var(--ca-space-2, 8px); font-size: 18px; font-weight: 700; color: var(--ca-text-primary); }
  .plan-hero__price { display: flex; align-items: baseline; gap: var(--ca-space-1, 4px); margin-top: var(--ca-space-1, 4px); }
  .price-amount     { font-size: 32px; font-weight: 800; color: var(--ca-text-primary); line-height: 1; }
  .price-cycle      { font-size: 14px; color: var(--ca-text-secondary); }
  .plan-next        { margin: 0; font-size: 12px; color: var(--ca-text-hint); }
  .plan-features    { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ca-space-2, 8px); }
  .plan-feature     { display: flex; align-items: center; gap: var(--ca-space-2, 8px); font-size: 13px; color: var(--ca-text-secondary); }
  .plan-feature__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ca-semantic-success); flex-shrink: 0; }

  /* Payment card */
  .card-display {
    background: linear-gradient(135deg,
      color-mix(in oklch, var(--ca-brand-main) 40%, var(--ca-surface-base)),
      color-mix(in oklch, var(--ca-brand-main) 20%, var(--ca-surface-base))
    );
    border-radius: var(--ca-radius-lg);
    padding: var(--ca-space-5, 20px);
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3, 12px);
    border: 1px solid var(--ca-glass-border);
  }
  .card-chip       { width: 32px; height: 24px; border-radius: 4px; background: color-mix(in oklch, var(--ca-brand-main) 60%, var(--ca-surface-base)); opacity: 0.8; }
  .card-number     { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 0.15em; color: var(--ca-text-primary); font-family: ui-monospace, monospace; }
  .card-meta-label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ca-text-secondary); }
  .card-meta-value { margin: 0; font-size: 13px; font-weight: 500; color: var(--ca-text-primary); }

  /* Usage bars */
  .usage-item      { display: flex; flex-direction: column; gap: var(--ca-space-1, 6px); }
  .usage-header    { display: flex; justify-content: space-between; align-items: center; }
  .usage-label     { font-size: 13px; font-weight: 500; color: var(--ca-text-primary); }
  .usage-value     { font-size: 12px; color: var(--ca-text-secondary); }
  .usage-track     { height: 6px; border-radius: 999px; background: var(--ca-action-hover); overflow: hidden; }
  .usage-unlimited { margin: 0; font-size: 12px; color: var(--ca-semantic-success); }

  /* Pricing cards */
  .pricing-card     { display: flex; flex-direction: column; height: 100%; gap: var(--ca-space-4, 16px); }
  .pricing-name     { display: flex; align-items: center; gap: var(--ca-space-2, 8px); font-size: 16px; font-weight: 700; color: var(--ca-text-primary); }
  .pricing-price    { display: flex; align-items: baseline; gap: var(--ca-space-1, 4px); }
  .pricing-amount   { font-size: 28px; font-weight: 800; color: var(--ca-text-primary); line-height: 1; }
  .pricing-cycle    { font-size: 13px; color: var(--ca-text-secondary); }
  .pricing-features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ca-space-2, 8px); flex: 1; }
  .pricing-feature  { display: flex; align-items: center; gap: var(--ca-space-2, 8px); font-size: 13px; color: var(--ca-text-secondary); }
  .pricing-check    { color: var(--ca-semantic-success); font-weight: 700; font-size: 12px; }

  .inv-id     { font-family: ui-monospace, monospace; font-size: 12px; color: var(--ca-text-secondary); }
  .inv-amount { font-weight: 600; }
</style>
