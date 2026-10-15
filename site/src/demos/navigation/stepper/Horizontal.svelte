<script lang="ts">
  import { Stepper, Button, Card, Stack, Flex } from '@codeatlasdev/ui';

  let step = $state(0);
  const steps = [{ label: 'Account' }, { label: 'Profile' }, { label: 'Billing' }, { label: 'Review' }];
</script>

<Card material="glass" p="6" full>
  <Stack gap="6">
    <Stepper {steps} bind:current={step} />
    <div class="body">
      <p>Step {step + 1}: {steps[step].label}</p>
    </div>
    <Flex gap="2" justify="end">
      <Button variant="ghost" disabled={step <= 0} onclick={() => step--}>Back</Button>
      <Button variant="filled" disabled={step >= steps.length - 1} onclick={() => step++}>
        {step < steps.length - 1 ? 'Next' : 'Finish'}
      </Button>
    </Flex>
  </Stack>
</Card>

<style>
  .body { min-height: 80px; display: flex; align-items: center; padding: 0 4px; }
  .body p { margin: 0; font-size: var(--ca-font-size-body1); color: var(--ca-text-secondary); }
</style>
