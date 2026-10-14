<script lang="ts">
  import {
    Button, Chip, DESIGN_STYLES, RadioGroup, SegmentedControl, Select, Slider,
    TextField, THEME_PRESETS,
  } from '@codeatlasdev/ui';
  import type { DesignStyleId, ThemeDefinition } from '@codeatlasdev/ui';
  import { Moon, RotateCcw, Sun } from '@lucide/svelte';
  import {
    CASES, DENSITIES, EASINGS, ELEVATIONS, PAPERS, RADII, SURFACES, type EditorState,
  } from './editor-state';

  interface Props {
    editor: EditorState;
    /** Effective definition: recipe + edits. */
    def: Partial<ThemeDefinition>;
    /** Merge top-level keys into the edits. */
    patch: (p: Partial<ThemeDefinition>) => void;
    selectStyle: (id: DesignStyleId) => void;
    setScheme: (s: 'light' | 'dark') => void;
    reset: () => void;
  }
  let { editor, def, patch, selectStyle, setScheme, reset }: Props = $props();

  const opts = <T extends string>(v: readonly T[]) => v.map((value) => ({ value, label: value }));

  const ty = $derived(def.typography ?? {});
  const motion = $derived(def.motion ?? {});
  const border = $derived(def.border ?? {});
  const fonts = $derived(def.fonts ?? {});
  const family = (v: unknown) => (typeof v === 'string' ? v : '');

  // Brand color: a built-in swatch sets `defaultPreset`; a custom hex adds one brand preset.
  const brand = $derived(def.presets?.[0]?.color ?? '');
  const activePreset = $derived(def.defaultPreset ?? 'amber');
  let hex = $state('');
  $effect(() => { hex = brand; });
  const hexOk = $derived(hex === '' || /^#[0-9a-f]{6}$/i.test(hex));

  function setHex(v: string) {
    hex = v;
    if (/^#[0-9a-f]{6}$/i.test(v))
      patch({ presets: [{ id: 'brand', color: v as `#${string}`, label: 'Brand' }], defaultPreset: 'brand' });
  }

  const density = $derived(def.density ?? 'comfortable');
  const densityNumber = $derived(
    typeof density === 'number' ? density : { compact: 0.75, comfortable: 1, airy: 1.25 }[density]
  );

  const setTypography = (p: NonNullable<ThemeDefinition['typography']>) =>
    patch({ typography: { ...ty, ...p } });
  const setFont = (k: 'body' | 'display' | 'mono', v: string) => {
    const next = { ...fonts };
    if (v.trim()) next[k] = v;
    else delete next[k];
    patch({ fonts: next });
  };
</script>

{#snippet label(text: string, value?: string | number)}
  <div class="te-label"><span>{text}</span>{#if value !== undefined}<span class="te-val">{value}</span>{/if}</div>
{/snippet}

<div class="te-controls">
  <section class="te-sec" aria-labelledby="te-s-style">
    <h3 id="te-s-style" class="te-h">Design style</h3>
    <RadioGroup
      variant="cards"
      aria-label="Design style"
      value={editor.style}
      items={Object.values(DESIGN_STYLES).map((s) => ({ value: s.id, label: s.label, description: s.description }))}
      onchange={(v) => selectStyle(v as DesignStyleId)}
    />
  </section>

  <section class="te-sec" aria-labelledby="te-s-color">
    <h3 id="te-s-color" class="te-h">Color</h3>
    {@render label('Scheme preview')}
    <SegmentedControl
      aria-label="Scheme preview"
      fullWidth
      value={editor.scheme}
      onchange={(v) => setScheme(v as 'light' | 'dark')}
      items={[
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
      ]}
    />
    <TextField
      label="Brand color"
      placeholder="#ff5c00"
      value={hex}
      error={hexOk ? undefined : 'Use #rrggbb'}
      oninput={setHex}
    />
    {@render label('Built-in palettes', activePreset)}
    <div class="te-chips">
      {#each THEME_PRESETS as p (p.id)}
        <Chip
          label={p.label}
          selected={activePreset === p.id}
          onclick={() => patch({ presets: [], defaultPreset: p.id })}
        />
      {/each}
    </div>
  </section>

  <section class="te-sec" aria-labelledby="te-s-shape">
    <h3 id="te-s-shape" class="te-h">Shape and density</h3>
    {@render label('Surface style')}
    <Select
      label="Surface"
      options={opts(SURFACES)}
      value={def.defaultStyle ?? 'glass'}
      onchange={(v) => patch({ defaultStyle: v as never })}
    />
    {@render label('Radius scale', def.radius ?? 1)}
    <Slider min={0} max={2} step={0.05} value={def.radius ?? 1} onchange={([v]) => patch({ radius: v })} />
    {@render label('Control radius')}
    <SegmentedControl
      aria-label="Control radius"
      fullWidth
      value={def.controlRadius ?? 'md'}
      onchange={(v) => patch({ controlRadius: v as never })}
      items={opts(RADII)}
    />
    {@render label('Density', densityNumber)}
    <SegmentedControl
      aria-label="Density"
      fullWidth
      value={typeof density === 'number' ? '' : density}
      onchange={(v) => patch({ density: v as never })}
      items={opts(DENSITIES)}
    />
    <Slider min={0.5} max={1.5} step={0.05} value={densityNumber} onchange={([v]) => patch({ density: v })} />
    {@render label('Border width', `${border.width ?? 1}px`)}
    <Slider min={0} max={4} step={1} value={border.width ?? 1} onchange={([v]) => patch({ border: { ...border, width: v } })} />
    {@render label('Strong border', `${border.strong ?? 2}px`)}
    <Slider min={0} max={6} step={1} value={border.strong ?? 2} onchange={([v]) => patch({ border: { ...border, strong: v } })} />
  </section>

  <section class="te-sec" aria-labelledby="te-s-type">
    <h3 id="te-s-type" class="te-h">Typography</h3>
    <TextField label="Body font" placeholder="Inter, system-ui, sans-serif" value={family(fonts.body)} oninput={(v) => setFont('body', v)} />
    <TextField label="Display font" placeholder="Same as body" value={family(fonts.display)} oninput={(v) => setFont('display', v)} />
    <TextField label="Mono font" placeholder="ui-monospace, monospace" value={family(fonts.mono)} oninput={(v) => setFont('mono', v)} />
    {@render label('Type scale', ty.scale ?? 1)}
    <Slider min={0.8} max={1.3} step={0.01} value={ty.scale ?? 1} onchange={([v]) => setTypography({ scale: v })} />
    {@render label('Heading weight', ty.weights?.heading ?? 600)}
    <Slider min={300} max={900} step={100} value={ty.weights?.heading ?? 600} onchange={([v]) => setTypography({ weights: { ...ty.weights, heading: v } })} />
    <TextField label="Heading tracking" placeholder="-0.02em" value={ty.headingTracking ?? ''} oninput={(v) => setTypography({ headingTracking: v || undefined })} />
    {@render label('Heading case')}
    <SegmentedControl aria-label="Heading case" fullWidth value={ty.headingCase ?? 'none'} onchange={(v) => setTypography({ headingCase: v as never })} items={opts(CASES)} />
    <TextField label="Label tracking" placeholder="0.04em" value={ty.labelTracking ?? ''} oninput={(v) => setTypography({ labelTracking: v || undefined })} />
    {@render label('Label case')}
    <SegmentedControl aria-label="Label case" fullWidth value={ty.labelCase ?? 'none'} onchange={(v) => setTypography({ labelCase: v as never })} items={opts(CASES)} />
    {@render label('Line height', ty.lineHeight ?? 1.55)}
    <Slider min={1.2} max={2} step={0.05} value={ty.lineHeight ?? 1.55} onchange={([v]) => setTypography({ lineHeight: v })} />
    <TextField label="Measure" placeholder="65ch" value={ty.measure ?? ''} oninput={(v) => setTypography({ measure: v || undefined })} />
  </section>

  <section class="te-sec" aria-labelledby="te-s-fx">
    <h3 id="te-s-fx" class="te-h">Elevation, motion, texture</h3>
    {@render label('Elevation model')}
    <SegmentedControl aria-label="Elevation model" fullWidth value={def.elevation ?? 'soft'} onchange={(v) => patch({ elevation: v as never })} items={opts(ELEVATIONS)} />
    {@render label('Motion speed', motion.scale ?? 1)}
    <Slider min={0} max={2} step={0.1} value={motion.scale ?? 1} onchange={([v]) => patch({ motion: { ...motion, scale: v } })} />
    <Select label="Easing" options={opts(EASINGS)} value={motion.easing ?? 'standard'} onchange={(v) => patch({ motion: { ...motion, easing: v as never } })} />
    {@render label('Icon stroke', def.iconStroke ?? 2)}
    <Slider min={1} max={3} step={0.25} value={def.iconStroke ?? 2} onchange={([v]) => patch({ iconStroke: v })} />
    {@render label('Paper')}
    <SegmentedControl aria-label="Paper" fullWidth value={def.paper ?? 'mesh'} onchange={(v) => patch({ paper: v as never })} items={opts(PAPERS)} />
    {@render label('Noise', def.noise ?? 0)}
    <Slider min={0} max={0.12} step={0.01} value={def.noise ?? 0} onchange={([v]) => patch({ noise: v })} />
  </section>

  <Button variant="ghost" onclick={reset}><RotateCcw size={16} />Reset to {DESIGN_STYLES[editor.style].label}</Button>
</div>

<style>
  .te-controls { display: grid; gap: var(--ca-space-6); padding: var(--ca-space-4); min-width: 0; }
  .te-sec { display: grid; gap: var(--ca-space-3); min-width: 0; }
  .te-h { margin: 0; font-size: var(--ca-font-size-label); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ca-text-secondary); }
  .te-label { display: flex; justify-content: space-between; gap: var(--ca-space-2); font-size: var(--ca-font-size-body2); }
  .te-val { color: var(--ca-text-secondary); font-variant-numeric: tabular-nums; }
  .te-chips { display: flex; flex-wrap: wrap; gap: var(--ca-space-3); }
</style>
