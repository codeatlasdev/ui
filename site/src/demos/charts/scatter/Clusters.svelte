<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { ScatterChart, type ScatterSeries } from '@codeatlasdev/ui/charts';

  const cluster = (n: number, x0: number, xr: number, y0: number, yr: number, a: number, b: number, c: number, d: number) =>
    Array.from({ length: n }, (_, i): [number, number] => [
      Math.round(x0 + xr * (0.5 + 0.5 * Math.sin(i * a + b))),
      parseFloat((y0 + yr * (0.5 + 0.5 * Math.cos(i * c + d))).toFixed(2)),
    ]);

  // `color` is optional: omit it and the palette assigns one per series.
  const series: ScatterSeries[] = [
    { name: 'Premium', data: cluster(30, 9000, 5500, 8, 5.5, 0.53, 0.7, 0.47, 0.3) },
    { name: 'Standard', data: cluster(30, 4500, 4000, 3.5, 4, 0.61, 1.4, 0.39, 0.9) },
    { name: 'Free', data: cluster(30, 500, 3500, 0.5, 2.5, 0.71, 2.1, 0.59, 1.7) },
  ];
</script>

<Card material="glass" full>
  <ScatterChart {series} yName="Conversion %" yFormatter={(v) => `${v.toFixed(1)}%`} height="340px" />
</Card>
