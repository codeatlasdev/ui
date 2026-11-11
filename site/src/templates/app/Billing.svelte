<script lang="ts">
  import BillingScreen from '../_shared/BillingScreen.svelte';

  const currentPlan = {
    name:     'Pro',
    price:    '$79',
    cycle:    'per month',
    nextBill: 'Oct 22, 2026',
    features: ['Unlimited users', '100GB storage', 'Priority support', 'Advanced analytics'],
  };

  const invoices = [
    { id: 'INV-0024', date: 'Sep 1, 2026', amount: '$79.00', status: 'paid' },
    { id: 'INV-0023', date: 'Aug 1, 2026', amount: '$79.00', status: 'paid' },
    { id: 'INV-0022', date: 'Jul 1, 2026', amount: '$79.00', status: 'paid' },
    { id: 'INV-0021', date: 'Jun 1, 2026', amount: '$79.00', status: 'paid' },
    { id: 'INV-0020', date: 'May 1, 2026', amount: '$79.00', status: 'paid' },
    { id: 'INV-0019', date: 'Apr 1, 2026', amount: '$59.00', status: 'paid' },
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
      features: ['Everything in Pro', '1TB storage', 'Dedicated manager', 'Custom integrations', 'SLA 99.9%'],
    },
  ];

  const usage = [
    { label: 'Users',       used: 12,    limit: 'Unlimited', pct: undefined },
    { label: 'Storage',     used: 82,    limit: '100 GB',    pct: 82        },
    { label: 'API calls',   used: 48500, limit: '100,000',   pct: 49        },
    { label: 'Deployments', used: 23,    limit: '100',       pct: 23        },
  ];
</script>

<BillingScreen {currentPlan} {invoices} {plans} {usage}
  copy={{
    description: 'Plan, usage, and invoices.', upgradeCta: 'Upgrade plan',
    kpiSpend: 'Monthly spend', kpiUsers: 'Active users', kpiStorage: 'Storage used', kpiApi: 'API calls', kpiApiValue: '48.5k',
    currentPlanDesc: 'Your active plan and next billing date.', nextLabel: 'Next billing:', changePlan: 'Change plan',
    paymentDesc: 'Card on file for billing charges.', cardholder: 'Cardholder', expires: 'Expires',
    usageDesc: 'Current period consumption.', noLimit: 'No limit',
    plansTitle: 'Choose a plan', currentChip: 'Current',
    paid: 'Paid', failed: 'Failed',
  }}
/>
