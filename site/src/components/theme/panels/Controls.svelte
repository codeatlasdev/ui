<script lang="ts">
  import { Accordion, AccordionItem } from '@codeatlasdev/ui';
  import type { StudioState } from '../studio-state';
  import BrandPanel from './BrandPanel.svelte';
  import MotionPanel from './MotionPanel.svelte';
  import ShapePanel from './ShapePanel.svelte';
  import StylePanel from './StylePanel.svelte';
  import SurfacesPanel from './SurfacesPanel.svelte';
  import TypePanel from './TypePanel.svelte';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();

  let open = $state<string[]>(['brand', 'surfaces']);
</script>

<div class="ts-controls">
  <Accordion type="multiple" bind:value={open}>
    <AccordionItem value="brand" title="Brand"><BrandPanel {theme} {patch} /></AccordionItem>
    <AccordionItem value="surfaces" title="Surfaces"><SurfacesPanel {theme} {patch} /></AccordionItem>
    <AccordionItem value="style" title="Style"><StylePanel {theme} {patch} /></AccordionItem>
    <AccordionItem value="shape" title="Shape"><ShapePanel {theme} {patch} /></AccordionItem>
    <AccordionItem value="type" title="Type"><TypePanel {theme} {patch} /></AccordionItem>
    <AccordionItem value="motion" title="Motion and components"><MotionPanel {theme} {patch} /></AccordionItem>
  </Accordion>
</div>

<style>
  .ts-controls {
    min-width: 0;
    max-inline-size: 100%;
  }
</style>
