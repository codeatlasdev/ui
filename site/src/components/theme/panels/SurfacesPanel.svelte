<script lang="ts">
  import { Button, ColorField, IconButton, SegmentedControl } from '@codeatlasdev/ui';
  import { X } from '@lucide/svelte';
  import type { ColorRole, StudioState } from '../studio-state';
  import {
    nextColors,
    ROLE_GROUPS,
    ROLE_LABELS,
    startingColor,
    TEXT_ROLES,
    textAgainst,
    type SchemeKey,
  } from './controls-model';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();

  // The scheme being edited is independent of `theme.scheme` (what the preview shows).
  let scheme = $state<SchemeKey>('light');
  const set = $derived(theme.colors[scheme]);

  const write = (role: ColorRole, value: string | undefined) =>
    patch({ colors: nextColors(theme.colors, scheme, role, value) }, `color:${scheme}:${role}`);
</script>

<div class="ts-stack">
  <SegmentedControl
    aria-label="Scheme to edit"
    fullWidth
    size="sm"
    items={[
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ]}
    value={scheme}
    onchange={(v) => (scheme = v as SchemeKey)}
  />
  <p class="ts-hint">Unset roles keep the generated value. Set only what you want to pin.</p>

  {#each ROLE_GROUPS as group (group.title)}
    <section class="ts-group" aria-labelledby="ts-roles-{group.title}">
      <h4 id="ts-roles-{group.title}" class="ts-sub">{group.title}</h4>
      {#each group.roles as role (role)}
        {@const label = ROLE_LABELS[role]}
        {@const value = set[role]}
        {#if value === undefined}
          <div class="ts-unset">
            <span id="ts-set-{role}-l" class="ts-unset__label">{label}</span>
            <Button
              size="sm"
              variant="outlined"
              tone="neutral"
              id="ts-set-{role}-b"
              aria-labelledby="ts-set-{role}-b ts-set-{role}-l"
              onclick={() => write(role, startingColor(role, scheme, theme))}
            >Set</Button>
          </div>
        {:else}
          <div class="ts-set">
            <div class="ts-set__field">
              <ColorField
                {label}
                {value}
                against={TEXT_ROLES.includes(role) ? textAgainst(scheme, theme) : undefined}
                role="text"
                minRatio={4.5}
                onchange={(v) => write(role, v)}
              />
            </div>
            <IconButton
              variant="text"
              size="sm"
              aria-label="Reset {label}"
              onclick={() => write(role, undefined)}
            >
              <X size={16} aria-hidden="true" />
            </IconButton>
          </div>
        {/if}
      {/each}
    </section>
  {/each}
</div>

<style>
  .ts-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    min-width: 0;
  }
  .ts-hint {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
  .ts-group {
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
  .ts-unset,
  .ts-set {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-2);
    min-width: 0;
  }
  .ts-unset__label {
    font-size: var(--ca-font-size-label);
    color: var(--ca-text-secondary);
  }
  .ts-set__field {
    flex: 1;
    min-width: 0;
  }
</style>
