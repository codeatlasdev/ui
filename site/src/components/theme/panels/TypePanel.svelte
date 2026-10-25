<script lang="ts">
  import { Chip, Select, SliderField, Switch, TextField } from '@codeatlasdev/ui';
  import { byRole, familyOf, FONTS, loadFont, PAIRS, stackOf, type FontRole } from '../fonts';
  import type { StudioState } from '../studio-state';
  import TypeRoles from './TypeRoles.svelte';
  import { TRACKING_ERROR, validTracking } from './controls-model';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();

  const ROLES: { role: FontRole; label: string }[] = [
    { role: 'body', label: 'Body font' },
    { role: 'display', label: 'Display font' },
    { role: 'mono', label: 'Mono font' },
  ];

  /** Options for one role; a hand-typed stack gets an extra "Custom" entry. */
  function optionsFor(role: FontRole) {
    const list = byRole(role).map((f) => ({ value: f.id, label: `${f.family} (${f.feel})` }));
    const custom = theme.fonts[role] && !familyOf(theme.fonts[role]) ? [{ value: '__custom', label: 'Custom' }] : [];
    return [{ value: '', label: 'Default' }, ...custom, ...list];
  }
  const current = (role: FontRole) => {
    const stack = theme.fonts[role];
    if (!stack) return '';
    return familyOf(stack)?.id ?? '__custom';
  };

  function pick(role: FontRole, id: string) {
    if (id === '__custom') return;
    const family = FONTS.find((f) => f.id === id) ?? null;
    void loadFont(family);
    patch({ fonts: { ...state.fonts, [role]: family ? stackOf(family) : undefined } });
  }

  function applyPair(id: string) {
    const pair = PAIRS.find((p) => p.id === id);
    if (!pair) return;
    const get = (fid?: string) => FONTS.find((f) => f.id === fid) ?? null;
    const body = get(pair.body);
    const display = get(pair.display);
    const mono = get(pair.mono);
    for (const f of [body, display, mono]) void loadFont(f);
    patch({
      fonts: {
        body: body ? stackOf(body) : undefined,
        display: display ? stackOf(display) : undefined,
        mono: mono ? stackOf(mono) : undefined,
      },
    });
  }
  const pairActive = (id: string) => {
    const p = PAIRS.find((x) => x.id === id);
    const f = theme.fonts;
    const stack = (fid?: string) => {
      const fam = FONTS.find((x) => x.id === fid);
      return fam ? stackOf(fam) : undefined;
    };
    return !!p && f.body === stack(p.body) && f.display === stack(p.display) && f.mono === stack(p.mono);
  };

  let tracking = $state('');
  let trackingError = $state('');
  $effect(() => {
    tracking = theme.headingTracking;
    trackingError = '';
  });
  function commitTracking(v: string) {
    if (!validTracking(v)) return (trackingError = TRACKING_ERROR);
    trackingError = '';
    patch({ headingTracking: v }, 'headingTracking');
  }
</script>

<div class="ts-stack">
  {#each ROLES as r (r.role)}
    <Select
      label={r.label}
      options={optionsFor(r.role)}
      value={current(r.role)}
      onchange={(id) => pick(r.role, id)}
    />
  {/each}

  <div class="ts-field">
    <span class="ts-label">Font pairs</span>
    <div class="ts-chips">
      {#each PAIRS as p (p.id)}
        <Chip label={p.label} size="sm" selected={pairActive(p.id)} onclick={() => applyPair(p.id)} />
      {/each}
    </div>
  </div>

  <SliderField
    label="Font scale"
    unit="x"
    min={0.8}
    max={1.3}
    step={0.01}
    value={theme.fontScale}
    onchange={(v) => patch({ fontScale: v }, 'fontScale')}
  />
  <SliderField
    label="Line height"
    min={1.2}
    max={2}
    step={0.05}
    value={theme.lineHeight}
    onchange={(v) => patch({ lineHeight: v }, 'lineHeight')}
  />
  <SliderField
    label="Heading weight"
    min={300}
    max={900}
    step={100}
    value={theme.headingWeight}
    onchange={(v) => patch({ headingWeight: v }, 'headingWeight')}
  />
  <TextField
    label="Heading tracking"
    size="sm"
    placeholder="-0.02em"
    value={tracking}
    error={trackingError}
    spellcheck={false}
    oninput={(v) => (tracking = v)}
    onchange={commitTracking}
  />
  <Switch
    label="Uppercase headings"
    checked={theme.headingCase === 'uppercase'}
    onchange={(on) => patch({ headingCase: on ? 'uppercase' : 'none' })}
  />
  <Switch
    label="Uppercase labels"
    checked={theme.labelCase === 'uppercase'}
    onchange={(on) => patch({ labelCase: on ? 'uppercase' : 'none' })}
  />

  <TypeRoles {theme} {patch} />
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
  }
  .ts-label {
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
  }
  .ts-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ca-space-2);
  }
</style>
