<script lang="ts">
  import { Button, MotionStage } from '@codeatlasdev/ui';

  const lines = ['Meet your new', 'finance co-pilot'];
  let manual = $state(0);
</script>

<MotionStage label="Blur in: a headline sharpens from a blur, line by line" loop={3400}>
  {#snippet children(m)}
    <div class="bi">
      {#key `${m.cycle}:${manual}`}
        <h3 class="bi__title" aria-label={lines.join(' ')}>
          {#each lines as line, i (i)}
            <span class="bi__line" class:bi__line--run={!m.reduced} style="--i:{i}" aria-hidden="true">{line}</span>
          {/each}
        </h3>
      {/key}
      <Button size="sm" variant="outlined" onclick={() => manual++}>Sharpen again</Button>
    </div>
  {/snippet}
</MotionStage>

<style>
  .bi { display: grid; gap: var(--ca-space-3); justify-items: start; }
  .bi__title {
    display: grid;
    margin: 0;
    font-family: var(--ca-font-display);
    font-size: var(--ca-font-size-h2);
    font-weight: var(--ca-font-weight-heading);
    line-height: 1.1;
    color: var(--ca-text-primary);
  }
  .bi__line { display: block; }
  .bi__line--run { animation: blur-in 900ms cubic-bezier(0.2, 0, 0, 1) calc(var(--i) * 160ms) both; }
  @keyframes blur-in {
    from { opacity: 0; filter: blur(12px); transform: translateY(8px); }
    to { opacity: 1; filter: blur(0); transform: translateY(0); }
  }
</style>
