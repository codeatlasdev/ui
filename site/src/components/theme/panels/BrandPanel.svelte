<script lang="ts">
  import { Alert, ColorField, SegmentedControl, SwatchGroup, Switch } from '@codeatlasdev/ui';
  import type { SwatchItem } from '@codeatlasdev/ui';
  import { THEME_PRESETS } from '../engine';
  import { STUDIO_PRESET, type StudioState } from '../studio-state';
  import { contrastReport, engineIssues } from '../studio-output';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();

  const uid = $props.id();

  const swatches = $derived<SwatchItem[]>([
    { value: STUDIO_PRESET, label: 'Studio (your brand)', color: theme.brand },
    ...THEME_PRESETS.map((p) => ({ value: p.id, label: p.label })),
  ]);

  // 'system' is previewed as dark by the studio.
  const shown = $derived(theme.scheme === 'light' ? 'light' : 'dark');
  const findings = $derived(
    contrastReport(theme)
      .filter((f) => f.scheme === shown)
      .toSorted((a, b) => Number(a.pass) - Number(b.pass)),
  );
  const issues = $derived(engineIssues(theme));

  const separate = $derived(theme.brandDark !== undefined);
</script>

<div class="ts-stack">
  <ColorField
    label="Brand color"
    value={theme.brand}
    against="#ffffff"
    role="fill"
    minRatio={3}
    description="Generates the whole Studio preset."
    onchange={(v) => patch({ brand: v }, 'brand')}
  />

  <Switch
    label="Separate dark brand"
    checked={separate}
    onchange={(on) => patch({ brandDark: on ? theme.brand : undefined })}
  />
  {#if separate}
    <ColorField
      label="Dark brand color"
      value={theme.brandDark ?? theme.brand}
      against="#0b0b0f"
      role="fill"
      minRatio={3}
      onchange={(v) => patch({ brandDark: v }, 'brandDark')}
    />
  {/if}

  <div class="ts-field">
    <span class="ts-label">Preset</span>
    <SwatchGroup
      aria-label="Brand preset"
      items={swatches}
      value={theme.preset}
      onchange={(v) => patch({ preset: v })}
    />
  </div>

  <div class="ts-field">
    <span class="ts-label">Color scheme</span>
    <SegmentedControl
      aria-label="Color scheme"
      fullWidth
      size="sm"
      items={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
      ]}
      value={theme.scheme}
      onchange={(v) => patch({ scheme: v as StudioState['scheme'] })}
    />
  </div>

  <section class="ts-field" aria-labelledby="{uid}-contrast">
    <h4 id="{uid}-contrast" class="ts-label">Contrast in {shown} mode</h4>
    <ul class="ts-findings" aria-live="off">
      {#each findings as f (f.label)}
        <li class="ts-finding" data-pass={f.pass ? '' : undefined}>
          <span class="ts-finding__label">{f.label}</span>
          <span class="ts-finding__ratio">{f.ratio.toFixed(1)}:1</span>
          <strong class="ts-finding__verdict">{f.pass ? 'Pass' : 'Fail'}</strong>
        </li>
      {/each}
    </ul>
  </section>

  {#if issues.length}
    <Alert severity="warning" title="Hand-set colors need a look">
      <ul class="ts-issues">
        {#each issues as i (i.message)}
          <li>{i.message}</li>
        {/each}
      </ul>
    </Alert>
  {/if}
</div>

<style>
  .ts-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    min-width: 0;
  }
  .ts-field {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-2);
    min-width: 0;
  }
  .ts-label {
    margin: 0;
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
  }
  .ts-findings,
  .ts-issues {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1);
  }
  .ts-issues {
    list-style: disc;
    padding-inline-start: var(--ca-space-4);
  }
  .ts-finding {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: var(--ca-space-2);
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
  .ts-finding__ratio {
    font-variant-numeric: tabular-nums;
  }
  .ts-finding__verdict {
    min-inline-size: 2.5rem;
    text-align: end;
    color: var(--ca-text-primary);
  }
  .ts-finding:not([data-pass]) .ts-finding__verdict {
    color: var(--ca-semantic-error);
  }
</style>
