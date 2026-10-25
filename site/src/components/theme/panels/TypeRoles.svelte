<script lang="ts">
  import { Button, SliderField, TextField } from '@codeatlasdev/ui';
  import type { StudioState } from '../studio-state';
  import {
    nextTypeEdit,
    SIZE_ERROR,
    TRACKING_ERROR,
    TYPE_ROLE_LABELS,
    TYPE_ROLES,
    validSize,
    validTracking,
    type TypeRole,
  } from './controls-model';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();

  // Draft text and error per `role:field`. Invalid input stays visible and never reaches state.
  let drafts = $state<Record<string, string>>({});
  let errors = $state<Record<string, string>>({});

  const shown = (role: TypeRole, field: 'size' | 'tracking') =>
    drafts[`${role}:${field}`] ?? theme.type[role]?.[field] ?? '';

  function commit(role: TypeRole, field: 'size' | 'tracking', v: string) {
    const k = `${role}:${field}`;
    const ok = field === 'size' ? validSize(v) : validTracking(v);
    if (!ok) {
      errors[k] = field === 'size' ? SIZE_ERROR : TRACKING_ERROR;
      return;
    }
    delete errors[k];
    delete drafts[k];
    patch({ type: nextTypeEdit(theme.type, role, { [field]: v || undefined }) }, k);
  }

  function reset(role: TypeRole) {
    for (const f of ['size', 'tracking']) {
      delete drafts[`${role}:${f}`];
      delete errors[`${role}:${f}`];
    }
    patch({ type: nextTypeEdit(theme.type, role, { size: undefined, tracking: undefined, weight: undefined, leading: undefined }) });
  }
</script>

<section class="ts-roles" aria-labelledby="ts-type-roles">
  <h4 id="ts-type-roles" class="ts-sub">Type roles</h4>
  {#each TYPE_ROLES as role (role)}
    {@const label = TYPE_ROLE_LABELS[role]}
    <fieldset class="ts-role">
      <legend class="ts-role__name">{label}</legend>
      <TextField
        label="{label} size"
        size="sm"
        placeholder="14px"
        value={shown(role, 'size')}
        error={errors[`${role}:size`]}
        spellcheck={false}
        oninput={(v) => (drafts[`${role}:size`] = v)}
        onchange={(v) => commit(role, 'size', v)}
      />
      <TextField
        label="{label} tracking"
        size="sm"
        placeholder="0em"
        value={shown(role, 'tracking')}
        error={errors[`${role}:tracking`]}
        spellcheck={false}
        oninput={(v) => (drafts[`${role}:tracking`] = v)}
        onchange={(v) => commit(role, 'tracking', v)}
      />
      <SliderField
        label="{label} weight"
        min={100}
        max={900}
        step={100}
        value={theme.type[role]?.weight ?? 400}
        onchange={(v) => patch({ type: nextTypeEdit(theme.type, role, { weight: v }) }, `type:${role}:weight`)}
      />
      <div>
        <Button
          size="sm"
          variant="ghost"
          tone="neutral"
          disabled={!theme.type[role]}
          aria-label="Reset {label}"
          onclick={() => reset(role)}
        >Reset</Button>
      </div>
    </fieldset>
  {/each}
</section>

<style>
  .ts-roles {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    min-width: 0;
  }
  .ts-sub {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .ts-role {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    min-width: 0;
    margin: 0;
    padding: var(--ca-space-3);
    border: 0;
    border-radius: var(--ca-radius-md);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .ts-role__name {
    padding-inline: var(--ca-space-1);
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
  }
</style>
