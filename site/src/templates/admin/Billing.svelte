<script lang="ts">
  import BillingScreen from '../_shared/BillingScreen.svelte';

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
</script>

<BillingScreen {currentPlan} {invoices} {plans} {usage} locale="pt-BR"
  copy={{
    description: 'Plan, usage and invoices.', upgradeCta: 'Fazer upgrade',
    kpiSpend: 'Gasto mensal', kpiUsers: 'Active users', kpiStorage: 'Armazenamento', kpiApi: 'Chamadas API', kpiApiValue: '48,5k',
    currentPlanDesc: 'Your active plan and next charge.', nextLabel: 'Next charge:', changePlan: 'Mudar plano',
    paymentDesc: 'Card on file for charges.', cardholder: 'Titular', expires: 'Validade',
    usageDesc: 'Consumption for the current period.', noLimit: 'Sem limite',
    plansTitle: 'Choose your plan', currentChip: 'Atual',
    paid: 'Pago', failed: 'Falhou',
  }}
/>
