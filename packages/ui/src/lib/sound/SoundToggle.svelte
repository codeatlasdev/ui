<script lang="ts">
  import { Volume2, VolumeOff } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { useMessages } from '../i18n/state.svelte.js';
  import { soundToggle } from '../i18n/groups/soundToggle.js';
  import { sound } from './engine.js';
  const t = useMessages(soundToggle);

  interface Props {
    /** Accessible name and tooltip. */
    label?: string;
    size?: number;
    /** Adds a volume slider beside the button. */
    volume?: boolean;
    class?: string;
  }

  let { label, size = 18, volume = false, class: className = '' }: Props = $props();

  // Sound state lives in the engine (persisted); mirror it so the button re-renders.
  let on = $state(false);
  let level = $state(0.25);
  onMount(() => {
    const read = () => {
      on = sound.enabled;
      level = sound.volume;
    };
    read();
    return sound.subscribe(read);
  });

  const name = $derived(label ?? t().soundToggle.label);

  function toggle() {
    sound.enable(!on);
    // The click is the user's gesture: let it confirm itself once the context unlocks.
    if (!on) queueMicrotask(() => sound.play('toggle-on'));
  }
</script>

<span class="ca-sound-toggle {className}">
  <!-- aria-pressed carries the state; the icon swap is decoration. Sound is never the only signal. -->
  <button
    type="button"
    class="ca-rail-btn ca-sound-toggle__btn"
    aria-label={name}
    title={name}
    aria-pressed={on}
    onclick={toggle}
  >
    {#if on}<Volume2 {size} />{:else}<VolumeOff {size} />{/if}
  </button>
  {#if volume && on}
    <input
      type="range"
      class="ca-sound-toggle__volume"
      min="0"
      max="1"
      step="0.05"
      value={level}
      aria-label={t().soundToggle.volume}
      oninput={(e) => sound.setVolume(e.currentTarget.valueAsNumber)}
    />
  {/if}
</span>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-sound-toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-2);
    }

    .ca-sound-toggle__btn[aria-pressed='true'] {
      color: var(--ca-brand-main);
    }

    .ca-sound-toggle__volume {
      width: calc(var(--ca-space-16) + var(--ca-space-4));
      accent-color: var(--ca-brand-main);
    }
}
</style>
