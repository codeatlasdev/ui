<script lang="ts">
  import { Card, MotionStage } from '@codeatlasdev/ui';
</script>

<MotionStage label="Fade rise: a card fades in while rising into place" loop={2400}>
  {#snippet children(m)}
    <!-- Keyed on the cycle: a new cycle mounts a fresh element, so the animation runs again. -->
    {#key m.cycle}
      <div class="rise" class:rise--run={!m.reduced}>
        <Card>
          <p class="rise__title">Invoice paid</p>
          <p class="rise__body">The card fades in and rises 16px into place.</p>
        </Card>
      </div>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .rise { width: 100%; max-width: 320px; }
  .rise--run { animation: fade-rise 420ms cubic-bezier(0.2, 0, 0, 1) 80ms both; }
  .rise__title { margin: 0; font-weight: var(--ca-font-weight-semibold); }
  .rise__body { margin: var(--ca-space-1) 0 0; color: var(--ca-text-secondary); }
  @keyframes fade-rise {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
