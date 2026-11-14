<script lang="ts">
  // #1235: options from a literal union. `svelte-check` (bun run check) is the type test: `value`,
  // `items` and `onchange` must carry `Scenario`, not widen it to `string`.
  import SegmentedControl from './SegmentedControl.svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  type Scenario = 'support' | 'connect' | 'campaign';
  const items: { value: Scenario; label: string }[] = [
    { value: 'support', label: 'Support bot' },
    { value: 'connect', label: 'Connect a number' },
    { value: 'campaign', label: 'Opt-in campaign' },
  ];

  let picked = $state<Scenario>('support');
  let toggled = $state<Scenario[]>([]);

  function select(id: Scenario) {
    picked = id;
  }
  function toggle(next: Scenario | Scenario[]) {
    toggled = Array.isArray(next) ? next : [next];
  }
</script>

<SegmentedControl aria-label="Scenario" {items} value={picked} onchange={select} />
<ToggleGroup aria-label="Scenarios" type="multiple" {items} value={toggled} onchange={toggle} />
<output data-testid="picked">{picked}</output>
<output data-testid="toggled">{toggled.join(',')}</output>
