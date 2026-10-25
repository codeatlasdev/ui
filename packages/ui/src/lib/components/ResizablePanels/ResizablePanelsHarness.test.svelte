<script lang="ts">
  import ResizablePanels from './ResizablePanels.svelte';
  import ResizablePanel from './ResizablePanel.svelte';
  import ResizableHandle from './ResizableHandle.svelte';

  let {
    direction = 'horizontal',
    persist,
    onlayout,
    three = false,
    min = 20,
    max = 80,
    wide = false,
  }: {
    direction?: 'horizontal' | 'vertical';
    persist?: string;
    onlayout?: (sizes: number[]) => void;
    three?: boolean;
    min?: number;
    max?: number;
    wide?: boolean;
  } = $props();
</script>

<div class="host">
  <ResizablePanels {direction} {persist} {onlayout} label="Editor layout">
    <ResizablePanel id="a" defaultSize={three ? 25 : 50} minSize={min} maxSize={max}>{wide ? 'A very long label that overflows a narrow panel' : 'A'}</ResizablePanel>
    <ResizableHandle label="Resize sidebar" />
    <ResizablePanel id="b" defaultSize={three ? 50 : 50} minSize={min} maxSize={max}>B</ResizablePanel>
    {#if three}
      <ResizableHandle label="Resize inspector" />
      <ResizablePanel id="c" defaultSize={25} minSize={min} maxSize={max}>C</ResizablePanel>
    {/if}
  </ResizablePanels>
</div>

<style>
  .host { width: 600px; height: 300px; }
</style>
