<script lang="ts">
  import { TextField } from '@codeatlasdev/ui';
  import { THEME_PRESETS } from '../engine';
  import { type Look, LOOKS } from '../looks';
  import type { StudioState } from '../studio-state';

  interface Props {
    theme: StudioState;
    onpick: (look: Look) => void;
  }
  let { theme, onpick }: Props = $props();

  const uid = $props.id();

  let query = $state('');

  const shown = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOOKS;
    return LOOKS.filter((l) => `${l.label} ${l.blurb}`.toLowerCase().includes(q));
  });

  /** A look is current when its brand and base are the editor's (lowercase hex compare). */
  const isCurrent = (l: Look) =>
    (l.state.brand ?? theme.brand).toLowerCase() === theme.brand.toLowerCase() &&
    (l.state.base ?? 'default') === theme.base;

  const presets = $derived(
    THEME_PRESETS.map(
      (p): Look => ({
        id: p.id,
        label: p.label,
        blurb: '',
        swatch: [p.swatchColor, p.swatchColor, p.swatchColor, p.swatchColor],
        state: { preset: p.id },
      }),
    ),
  );
</script>

<div class="ts-stack">
  <TextField
    label="Search looks"
    placeholder="Search by name or mood"
    type="search"
    bind:value={query}
  />

  <section class="ts-section" aria-labelledby="{uid}-looks">
    <h4 id="{uid}-looks" class="ts-heading">Looks</h4>
    {#if shown.length > 0}
      <ul class="ts-grid">
        {#each shown as look (look.id)}
          <li class="ts-cell">
            <button
              type="button"
              class="ts-card"
              aria-pressed={isCurrent(look)}
              onclick={() => onpick(look)}
            >
              <span class="ts-dots" aria-hidden="true">
                {#each look.swatch as c, i (i)}
                  <span class="ts-dot" style="--ts-c:{c}"></span>
                {/each}
              </span>
              <span class="ts-name">{look.label}</span>
              <span class="ts-blurb">{look.blurb}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="ts-empty" role="status">No looks match "{query}".</p>
    {/if}
  </section>

  <section class="ts-section" aria-labelledby="{uid}-presets">
    <h4 id="{uid}-presets" class="ts-heading">Built-in brand presets</h4>
    <ul class="ts-presets">
      {#each presets as p (p.id)}
        <li>
          <button
            type="button"
            class="ts-preset"
            aria-pressed={theme.preset === p.id}
            onclick={() => onpick(p)}
          >
            <span class="ts-dot" style="--ts-c:{p.swatch[0]}" aria-hidden="true"></span>
            <span>{p.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .ts-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-5);
    min-width: 0;
  }
  .ts-section {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    min-width: 0;
  }
  .ts-heading {
    margin: 0;
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-primary);
  }
  .ts-grid,
  .ts-presets {
    list-style: none;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .ts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr));
    gap: var(--ca-space-2);
  }
  .ts-cell {
    min-width: 0;
    display: flex;
  }
  .ts-card {
    all: unset;
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    min-block-size: 2.75rem;
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1);
    padding: var(--ca-space-3);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-raised);
    box-shadow: inset 0 0 0 1px var(--ca-outline-default);
    cursor: pointer;
    color: var(--ca-text-primary);
  }
  .ts-card:hover {
    box-shadow: inset 0 0 0 1px var(--ca-outline-strong);
  }
  .ts-card[aria-pressed='true'] {
    box-shadow: inset 0 0 0 2px var(--ca-brand-main);
  }
  .ts-card:focus-visible,
  .ts-preset:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: 2px;
  }
  .ts-dots {
    display: flex;
    gap: var(--ca-space-1);
  }
  .ts-dot {
    inline-size: 1rem;
    block-size: 1rem;
    flex: none;
    border-radius: var(--ca-radius-pill);
    background: var(--ts-c);
    box-shadow: inset 0 0 0 1px var(--ca-outline-default);
  }
  .ts-name {
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    overflow-wrap: anywhere;
  }
  .ts-blurb {
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    overflow-wrap: anywhere;
  }
  .ts-presets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ca-space-2);
  }
  .ts-preset {
    all: unset;
    box-sizing: border-box;
    min-block-size: 2.75rem;
    display: inline-flex;
    align-items: center;
    gap: var(--ca-space-2);
    padding-inline: var(--ca-space-3);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-surface-raised);
    box-shadow: inset 0 0 0 1px var(--ca-outline-default);
    font-size: var(--ca-font-size-label);
    color: var(--ca-text-primary);
    cursor: pointer;
  }
  .ts-preset[aria-pressed='true'] {
    box-shadow: inset 0 0 0 2px var(--ca-brand-main);
  }
  .ts-empty {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>
