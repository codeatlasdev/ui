<script lang="ts">
  import { RadioGroup } from '@codeatlasdev/ui';

  let plan = $state('pro');

  const plans = [
    { value: 'free', label: 'Free', description: 'For side projects.' },
    { value: 'pro', label: 'Pro', description: 'For teams that ship weekly.' },
    { value: 'team', label: 'Team', description: 'Shared billing and audit log.', disabled: true },
  ];
</script>

<RadioGroup variant="cards" aria-label="Plan" items={plans} bind:value={plan} />
