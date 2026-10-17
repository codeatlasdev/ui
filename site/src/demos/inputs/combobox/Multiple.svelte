<script lang="ts">
  import { Combobox } from '@codeatlasdev/ui';

  const labels = [
    { value: 'bug', label: 'Bug' },
    { value: 'docs', label: 'Documentation' },
    { value: 'ui', label: 'UI' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'perf', label: 'Performance' },
    { value: 'legacy', label: 'Legacy', disabled: true },
  ];

  let selected = $state<string[]>(['bug', 'ui']);
</script>

<div class="col">
  <Combobox
    multiple
    label="Labels"
    description="Backspace on an empty search removes the last chip."
    options={labels}
    bind:value={selected}
  />
  <p class="out">Selected: <code>{selected.join(', ') || 'none'}</code></p>
</div>

<style>
  .col {
    width: 100%;
    max-width: 360px;
  }

  .out {
    margin: var(--ca-space-3) 0 0;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
  }
</style>
