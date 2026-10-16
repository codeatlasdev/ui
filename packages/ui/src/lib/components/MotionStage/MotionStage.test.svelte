<script lang="ts">
  import MotionStage from './MotionStage.svelte';

  /** `spacer`: px above the stage, so a test can place it outside the viewport. */
  let { spacer = 0, loop = 150 }: { spacer?: number; loop?: number } = $props();
</script>

<div style:height="{spacer}px"></div>
<MotionStage label="Fade rise" {loop}>
  {#snippet children(m)}
    {#key m.cycle}
      <div class="probe" data-final={m.reduced}>
        <input aria-label="probe field" />
      </div>
    {/key}
  {/snippet}
</MotionStage>
