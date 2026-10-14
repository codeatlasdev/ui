<script lang="ts" module>
  export interface AccordionContext {
    isOpen(value: string): boolean;
    toggle(value: string): void;
  }

  export const ACCORDION_KEY = Symbol('ca-accordion');
</script>

<script lang="ts">
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'single' | 'multiple';
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    class?: string;
    children?: Snippet;
  }

  let { type = 'single', value = $bindable(), onValueChange, class: className = '', children }: Props = $props();

  const openSet = $derived(
    type === 'multiple'
      ? new Set(Array.isArray(value) ? value : [])
      : new Set(typeof value === 'string' && value !== '' ? [value] : [])
  );

  function commit(next: string | string[]) {
    value = next;
    onValueChange?.(next);
  }

  setContext<AccordionContext>(ACCORDION_KEY, {
    isOpen: (v) => openSet.has(v),
    toggle(v) {
      if (type === 'multiple') {
        commit(openSet.has(v) ? [...openSet].filter((x) => x !== v) : [...openSet, v]);
      } else {
        commit(openSet.has(v) ? '' : v);
      }
    },
  });

  // APG accordion: every trigger stays in the tab order; Arrow Up/Down, Home and End move focus
  // between enabled triggers.
  function onkeydown(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    if (!(e.target instanceof Element) || !(e.currentTarget instanceof HTMLElement)) return;
    const from = e.target.closest<HTMLButtonElement>('.ca-accordion-item__trigger');
    if (!from) return;
    const list = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('.ca-accordion-item__trigger:not(:disabled)')
    );
    const i = list.indexOf(from);
    if (i < 0) return;
    const next =
      e.key === 'Home'
        ? list[0]
        : e.key === 'End'
          ? list[list.length - 1]
          : e.key === 'ArrowDown'
            ? list[(i + 1) % list.length]
            : list[(i - 1 + list.length) % list.length];
    e.preventDefault();
    next.focus();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- Keydown only coordinates focus between the real <button> triggers inside. -->
<div class="ca-accordion {className}" data-orientation="vertical" {onkeydown}>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-accordion) {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
      width: 100%;
    }
}
</style>
