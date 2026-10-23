<script lang="ts">
  import { colorScheme, tokenRgba } from '@codeatlasdev/ui';

  // Domain tokens come from the preset in theme.ts: tokens: { status: { new, won, lost } }.
  const statuses = [
    { name: 'new', label: 'New', count: 18 },
    { name: 'won', label: 'Won', count: 9 },
    { name: 'lost', label: 'Lost', count: 4 },
  ] as const;

  let canvas = $state<HTMLCanvasElement>();

  // The canvas cannot read oklch(): tokenRgba gives [r, g, b, a]. Reading colorScheme makes the
  // effect re-run when the scheme or the preset changes.
  $effect(() => {
    void colorScheme.resolved;
    void colorScheme.preset;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    statuses.forEach((s, i) => {
      const [r, g, b] = tokenRgba(`status.${s.name}`);
      ctx.fillStyle = `rgb(${r} ${g} ${b})`;
      ctx.fillRect(i * 100, canvas.height - s.count * 4, 80, s.count * 4);
    });
  });
</script>

<div class="st">
  <ul class="st__list" aria-label="Lead status">
    {#each statuses as s (s.name)}
      <li class="st__pill st__pill--{s.name}">{s.label} <strong>{s.count}</strong></li>
    {/each}
  </ul>
  <canvas bind:this={canvas} class="st__chart" width="300" height="80" role="img" aria-label="Leads by status: 18 new, 9 won, 4 lost"></canvas>
</div>

<style>
  .st {
    display: grid;
    gap: var(--ca-space-4);
    justify-items: start;
  }
  .st__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ca-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .st__pill {
    padding: var(--ca-space-1) var(--ca-space-3);
    border-radius: var(--ca-radius-pill);
    font-size: var(--ca-font-size-label);
  }
  .st__pill--new {
    background: var(--ca-token-status-new-subtle);
    color: var(--ca-token-status-new);
  }
  .st__pill--won {
    background: var(--ca-token-status-won-subtle);
    color: var(--ca-token-status-won);
  }
  .st__pill--lost {
    background: var(--ca-token-status-lost-subtle);
    color: var(--ca-token-status-lost);
  }
  .st__chart {
    width: 300px;
    height: 80px;
  }
</style>
