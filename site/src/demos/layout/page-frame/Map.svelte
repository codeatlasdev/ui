<script lang="ts">
  import { PageFrame, Button, TextField, SegmentedControl, stageInsets } from '@codeatlasdev/ui';

  let mode = $state('map');
  let side = $state('left');
  let query = $state('');
</script>

<div class="stage">
  <!-- The stage stand-in: a real map keeps this area interactive and pads fitBounds with stageInsets. -->
  <div class="map" aria-hidden="true">
    <span class="pin" style="--x: {50 + (stageInsets.current.left - stageInsets.current.right) / 16}%"></span>
  </div>

  <PageFrame mode={mode as 'map' | 'split' | 'page'} side={side as 'left' | 'right'} width="sm" label="Territory" headerBorder>
    {#snippet header()}
      <h2 class="title">Territory</h2>
      <p class="sub">Covers {stageInsets.current.left}px left, {stageInsets.current.right}px right</p>
    {/snippet}
    {#snippet toolbar()}
      <TextField label="Search" bind:value={query} />
    {/snippet}
    <SegmentedControl aria-label="Mode" bind:value={mode} items={[{ value: 'map', label: 'Map' }, { value: 'split', label: 'Split' }, { value: 'page', label: 'Page' }]} />
    <SegmentedControl aria-label="Side" bind:value={side} items={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
    {#snippet footer()}
      <Button variant="filled" size="sm">Save</Button>
    {/snippet}
  </PageFrame>
</div>

<style>
  .stage {
    --ca-vh: 380px;
    position: relative;
    width: 100%;
    height: 380px;
    contain: layout paint;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .map {
    position: absolute;
    inset: 0;
    background: var(--ca-surface-sunken, var(--ca-outline-subtle));
  }
  .pin {
    position: absolute;
    top: 50%;
    left: var(--x);
    width: var(--ca-space-4);
    height: var(--ca-space-4);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-brand-main);
    transition: left var(--ca-duration-base) var(--ca-ease-standard);
  }
  .title {
    margin: 0;
    font-size: var(--ca-font-size-h6);
  }
  .sub {
    margin: 0;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>
