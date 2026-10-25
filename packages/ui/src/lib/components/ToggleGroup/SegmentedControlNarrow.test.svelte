<script lang="ts">
  import SegmentedControl from './SegmentedControl.svelte';

  // A short label (the viewer's "390") in a slot too narrow for 44px per segment: the equal
  // shrinkable columns would squeeze each item below the touch target.
  let value = $state('a');
</script>

<div style="width: 110px">
  <SegmentedControl
    size="sm"
    aria-label="Width"
    bind:value
    items={[
      { value: 'a', label: '39' },
      { value: 'b', label: '76' },
      { value: 'c', label: '12' },
    ]}
  />
</div>
