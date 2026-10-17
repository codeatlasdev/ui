<script lang="ts">
  import { ToggleGroup } from '@codeatlasdev/ui';
  import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from '@lucide/svelte';

  let align = $state('left');
  let format = $state<string[]>(['bold']);
  let filter = $state('all');
</script>

<div class="col">
  <div>
    <ToggleGroup
      type="single"
      aria-label="Text alignment"
      bind:value={align}
      items={[
        { value: 'left', icon: AlignLeft, 'aria-label': 'Align left' },
        { value: 'center', icon: AlignCenter, 'aria-label': 'Align center' },
        { value: 'right', icon: AlignRight, 'aria-label': 'Align right' },
      ]}
    />
    <p class="out">value: {align || '–'}</p>
  </div>
  <div>
    <ToggleGroup
      type="single"
      required
      aria-label="Filter"
      bind:value={filter}
      items={[
        { value: 'all', label: 'All' },
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
      ]}
    />
    <p class="out">required, value: {filter}</p>
  </div>
  <div>
    <ToggleGroup
      type="multiple"
      aria-label="Text formatting"
      bind:value={format}
      items={[
        { value: 'bold', icon: Bold, 'aria-label': 'Bold' },
        { value: 'italic', icon: Italic, 'aria-label': 'Italic' },
        { value: 'underline', icon: Underline, 'aria-label': 'Underline' },
      ]}
    />
    <p class="out">value: {JSON.stringify(format)}</p>
  </div>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-5);
  }

  .out {
    margin: var(--ca-space-3) 0 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>
