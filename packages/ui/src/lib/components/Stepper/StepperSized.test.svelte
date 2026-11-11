<script lang="ts">
  import Stepper from './Stepper.svelte';

  let { width, orientation }: { width: number; orientation?: 'horizontal' | 'vertical' | 'auto' } = $props();
  // The repro of #988: four steps, each with a one-sentence description.
  const steps = [
    { label: 'Design the service', description: 'Build the map from blocks: when it starts, who talks, what happens next.' },
    { label: 'Configure the agents', description: 'Tell each agent who it is, what it must collect and what it must never do.' },
    { label: 'Test', description: 'Chat in the simulator and watch the path light up on the map.' },
    { label: 'Publish', description: 'Review what changed and publish. You can go back to any version.' },
  ];
</script>

<div data-testid="box" style="--w:{width}px">
  <Stepper {steps} {orientation} />
</div>
<span data-testid="ch20" class="ch20" aria-hidden="true"></span>

<style>
  [data-testid='box'] { width: var(--w); }
  .ch20 { display: inline-block; width: 20ch; font-size: var(--ca-font-size-micro); }
</style>
