<script lang="ts">
  // Billing shared by the admin and app templates. Layout, tabs and styles are identical; each passes
  // its own sample data, its copy and the locale used to format numbers.
  import {
    AppSettings, FormSection, Card, Grid, Flex, Button, KpiCard, KpiGrid,
    StatusChip, Chip, SimpleTable,
  } from '@codeatlasdev/ui';
  import { CreditCard, Download, TrendingUp, DollarSign, Users, Zap, Layers, FileText } from '@lucide/svelte';

  interface Props {
    currentPlan: { name: string; price: string; cycle: string; nextBill: string; features: string[] };
    invoices: { id: string; date: string; amount: string; status: string }[];
    plans: { name: string; price: string; cycle: string; current: boolean; features: string[] }[];
    usage: { label: string; used: number; limit: string; pct: number | undefined }[];
    /** Locale for number formatting; undefined uses the runtime default. */
    locale?: string;
    copy: {
      description: string; upgradeCta: string;
      kpiSpend: string; kpiUsers: string; kpiStorage: string; kpiApi: string; kpiApiValue: string;
      currentPlanDesc: string; nextLabel: string; changePlan: string;
      paymentDesc: string; cardholder: string; expires: string;
      usageDesc: string; noLimit: string;
      plansTitle: string; currentChip: string;
      paid: string; failed: string;
    };
  }
  let { currentPlan, invoices, plans, usage, locale, copy }: Props = $props();

  const TABS = [
    { value: 'overview', label: 'Overview', icon: CreditCard },
    { value: 'plans',    label: 'Plans',    icon: Layers     },
    { value: 'invoices', label: 'Invoices', icon: FileText   },
  ];

  let tab = $state('overview');
</script>

<AppSettings
  title="Billing"
  description={copy.description}
  tabs={TABS}
  activeTab={tab}
  onTabChange={(t) => (tab = t)}
>
  {#snippet actions()}
    <Button variant="filled" size="sm">
      {#snippet leading()}<TrendingUp size={14} />{/snippet}
      {copy.upgradeCta}
    </Button>
  {/snippet}

  <!-- OVERVIEW -->
  {#if tab === 'overview'}
    <KpiGrid>
      <KpiCard title={copy.kpiSpend} value="$79"   trend={0}    icon={DollarSign} />
      <KpiCard title={copy.kpiUsers}  value="12"    trend={20.0} icon={Users}      />
      <KpiCard title={copy.kpiStorage}  value="82 GB" trend={8.5}  icon={Zap}        />
      <KpiCard title={copy.kpiApi}     value={copy.kpiApiValue} trend={14.2} icon={TrendingUp} />
    </KpiGrid>

    <FormSection title="Current plan" description={copy.currentPlanDesc} layout="stack">
      <div class="plan-hero">
        <div class="plan-hero__name">
          {currentPlan.name}
          <Chip label="Active" variant="success" size="sm" />
        </div>
        <div class="plan-hero__price">
          <span class="price-amount">{currentPlan.price}</span>
          <span class="price-cycle">{currentPlan.cycle}</span>
        </div>
        <p class="plan-next">{copy.nextLabel} {currentPlan.nextBill}</p>
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
        <Button variant="outlined" size="sm">{copy.changePlan}</Button>
        <Button variant="ghost" size="sm" class="ca-btn-danger-ghost">Cancel plan</Button>
      </Flex>
    </FormSection>

    <FormSection title="Payment method" description={copy.paymentDesc} layout="stack">
      <div class="card-display">
        <div class="card-chip"></div>
        <p class="card-number">•••• •••• •••• 4242</p>
        <Flex justify="between">
          <div>
            <p class="card-meta-label">{copy.cardholder}</p>
            <p class="card-meta-value">Ana Lima</p>
          </div>
          <div>
            <p class="card-meta-label">{copy.expires}</p>
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

    <FormSection title="Usage this cycle" description={copy.usageDesc} layout="stack">
      <Grid columns={{ base: 1, md: 2 }} gap="5">
        {#each usage as u}
          <div class="usage-item">
            <div class="usage-header">
              <span class="usage-label">{u.label}</span>
              <span class="usage-value">
                {u.pct !== undefined
                  ? `${typeof u.used === 'number' ? u.used.toLocaleString(locale) : u.used} / ${u.limit}`
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
              <p class="usage-unlimited">{copy.noLimit}</p>
            {/if}
          </div>
        {/each}
      </Grid>
    </FormSection>
  {/if}

  <!-- PLANS -->
  {#if tab === 'plans'}
    <FormSection title={copy.plansTitle} description="Upgrade or downgrade at any time." layout="stack">
      <Grid columns={{ base: 1, md: 3 }} gap="4">
        {#each plans as p}
          <Card tone={p.current ? "brand" : "neutral"} p="6">
            <div class="pricing-card">
              <div class="pricing-name">
                {p.name}
                {#if p.current}<Chip label={copy.currentChip} variant="brand" size="sm" />{/if}
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

  <!-- INVOICES -->
  {#if tab === 'invoices'}
    <Card flush full>
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
                  label={inv.status === 'paid' ? copy.paid : copy.failed}
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
