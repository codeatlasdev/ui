<script lang="ts">
  import { type Snippet, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { createIds, setTabsContext, type TabsVariant } from './tabs-context.js';
  import { cueFor, soundBus, type SoundProp } from '../../utils/sound-bus.js';

  interface Props {
    value?:    string;
    onchange?: (v: string) => void;
    /**
     * Called before another tab is selected; `false` (or a promise of `false`) keeps the current tab and skips
     * `onchange`, e.g. to ask before a panel with unsaved changes unmounts. While a promise is pending, other
     * selections are ignored (#1075).
     */
    onbeforechange?: (next: string) => boolean | Promise<boolean>;
    /**
     * `automatic` (default): focusing a tab selects it. `manual`: arrows move focus and Enter, Space or a click
     * selects, so a focus a dialog gives back to a tab does not select it again (#1075).
     */
    activation?: 'automatic' | 'manual';
    /** `pill` fills the active tab on a glass list; `line` underlines it on a bare list (page headers). */
    variant?:  TabsVariant;
    /** The list stretches across its container and its hairline spans it (default: it hugs its tabs). */
    fill?:     boolean;
    class?:    string;
    children?: Snippet;
    /** Plays `tab` when the user selects another tab (a cue name replaces it) when `@codeatlasdev/ui/sound` is on. */
    sound?:    SoundProp;
  }

  let { value = $bindable(), onchange, onbeforechange, activation = 'automatic', variant = 'pill', fill = false, class: className = '', children, sound }: Props = $props();

  const base = $props.id();
  const ids = createIds(base);
  // Panels mounted per value (counted: a value may briefly have two during a keyed swap).
  const panels = new SvelteMap<string, number>();

  /** An async `onbeforechange` is answering: later selections wait for it, not race it. */
  let pending = false;

  function commit(next: string) {
    if (value === next) return;
    value = next;
    const cue = cueFor(sound, 'tab');
    if (cue) soundBus.emit(cue);
    onchange?.(next);
  }

  setTabsContext({
    ids,
    get value() {
      return value;
    },
    get variant() {
      return variant;
    },
    get fill() {
      return fill;
    },
    get activation() {
      return activation;
    },
    hasPanel: (v) => panels.has(v),
    // Called from TabsContent's $effect: read-modify-write untracked, or the effect would depend
    // on the map it writes and loop (effect_update_depth_exceeded).
    registerPanel(v) {
      untrack(() => panels.set(v, (panels.get(v) ?? 0) + 1));
      return () =>
        untrack(() => {
          const n = (panels.get(v) ?? 1) - 1;
          if (n > 0) panels.set(v, n);
          else panels.delete(v);
        });
    },
    select(next) {
      if (value === next || pending) return;
      const allowed = onbeforechange ? onbeforechange(next) : true;
      if (allowed instanceof Promise) {
        pending = true;
        allowed.then(
          (ok) => {
            pending = false;
            if (ok) commit(next);
          },
          () => (pending = false)
        );
      } else if (allowed) commit(next);
    },
  });
</script>

<div class="ca-tabs {className}" data-orientation="horizontal" data-variant={variant}>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-tabs) {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
}
</style>
