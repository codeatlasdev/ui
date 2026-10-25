<script lang="ts">
  import { Button, SegmentedControl } from '@codeatlasdev/ui';
  import { SoundToggle, brutal, glass, sound, system, terminal } from '@codeatlasdev/ui/sound';
  import type { CueName } from '@codeatlasdev/ui';
  import { onDestroy } from 'svelte';

  const PROFILES = { system, glass, brutal, terminal };
  const CUES: CueName[] = ['press', 'toggle-on', 'toggle-off', 'success', 'error', 'warning', 'open', 'close', 'tab'];

  let profile = $state<keyof typeof PROFILES>('system');
  $effect(() => sound.use(PROFILES[profile]));
  onDestroy(() => sound.use(undefined));
</script>

<div class="hear">
  <div class="hear__bar">
    <SoundToggle volume />
    <SegmentedControl
      aria-label="Sound profile"
      bind:value={profile}
      items={[
        { value: 'system', label: 'System' },
        { value: 'glass', label: 'Glass' },
        { value: 'brutal', label: 'Brutalism' },
        { value: 'terminal', label: 'Terminal' },
      ]}
    />
  </div>
  <div class="hear__board" role="group" aria-label="Cue board">
    {#each CUES as cue (cue)}
      <Button variant="outlined" size="sm" sound={cue}>{cue}</Button>
    {/each}
  </div>
</div>

<style>
  .hear { display: grid; gap: var(--ca-space-4); }
  .hear__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); }
  .hear__board { display: flex; flex-wrap: wrap; gap: var(--ca-space-2); }
</style>
