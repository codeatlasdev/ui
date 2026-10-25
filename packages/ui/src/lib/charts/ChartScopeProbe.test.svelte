<script lang="ts">
  // A chart-shaped consumer: it resolves its scope during init and tokens when it renders, exactly
  // like every public chart.
  import { chartPalette } from './palette.js';
  import { chartTokens, useChartScope } from './tokens.js';

  let { id }: { id: string } = $props();
  const scope = useChartScope();
  let host = $state<HTMLElement>();
  let brand = $state('');
  let palette = $state('');
  $effect(() => {
    if (!host || !scope.el) return;
    brand = chartTokens(scope.el).brand;
    palette = chartPalette(scope.el)[0] ?? '';
  });
</script>

<output bind:this={host} data-testid={id} data-brand={brand} data-palette={palette}></output>
