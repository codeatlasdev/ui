<script lang="ts">
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { storageGet, storageSet } from '../../utils/local-storage.js';
  import { moveBoundary, normalize, SPLITTER_KEY, type PanelSpec, type SplitterContext } from './splitter.js';

  /**
   * ResizablePanels — a group of panels split by draggable, keyboard-operable window splitters.
   *
   * <ResizablePanels label="Editor" persist="editor-layout">
   *   <ResizablePanel id="files" defaultSize={25} minSize={15}>…</ResizablePanel>
   *   <ResizableHandle label="Resize files" />
   *   <ResizablePanel id="editor" defaultSize={75}>…</ResizablePanel>
   * </ResizablePanels>
   *
   * Sizes are percentages of the group and always add up to 100. Give the group a height (or put it
   * in a sized parent): it fills its container. Each `ResizableHandle` is a WAI-ARIA window
   * splitter (`role="separator"`, focusable) that moves the boundary between its two neighbours.
   */
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'aria-label'> {
    /** `horizontal` puts panels side by side, `vertical` stacks them. @default 'horizontal' */
    direction?: 'horizontal' | 'vertical';
    /** Accessible name of the group. */
    label?: string;
    /** `localStorage` key: the layout is saved there when a drag or key press settles and restored on mount. */
    persist?: string;
    /** Called with the sizes (percent, in panel order) when a drag or key press settles. */
    onlayout?: (sizes: number[]) => void;
    class?: string;
    children?: Snippet;
  }

  let {
    direction = 'horizontal',
    label,
    persist,
    onlayout,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  let root = $state<HTMLElement>();
  let specs = $state<PanelSpec[]>([]);
  let sizes = $state<number[]>([]);
  // Where each panel starts; stored layouts override it on first registration pass.
  const initial = new Map<string, number>();
  let dragging = $state(false);

  const stored = $derived.by<Record<string, number> | null>(() => {
    if (!persist) return null;
    const v = storageGet<unknown>(persist, null);
    return v && typeof v === 'object' ? (v as Record<string, number>) : null;
  });

  function seed(next: PanelSpec[]) {
    // A stored layout wins only when it names exactly these panels.
    const fromStore =
      stored &&
      next.length === Object.keys(stored).length &&
      next.every((s) => Number.isFinite(stored[s.id]));
    if (fromStore) {
      sizes = normalize(next.map((s) => stored![s.id]));
      return;
    }
    // Panels with a defaultSize keep it; the others split what is left.
    const given = next.map((s) => initial.get(s.id));
    const taken = given.reduce<number>((sum, n) => sum + (n !== undefined && !Number.isNaN(n) ? n : 0), 0);
    const open = given.filter((n) => n === undefined || Number.isNaN(n)).length;
    const share = open ? Math.max(0, 100 - taken) / open : 0;
    sizes = normalize(given.map((n) => (n === undefined || Number.isNaN(n) ? share : n)));
  }

  function emit() {
    const out = sizes.map((n) => Math.round(n * 100) / 100);
    onlayout?.(out);
    if (persist) storageSet(persist, Object.fromEntries(specs.map((s, i) => [s.id, out[i]])));
  }

  const ctx: SplitterContext = {
    get direction() {
      return direction;
    },
    register(spec, start) {
      initial.set(spec.id, start);
      specs = [...specs, spec];
      seed(specs);
      return () => {
        specs = specs.filter((s) => s.id !== spec.id);
        initial.delete(spec.id);
        seed(specs);
      };
    },
    size: (id) => sizes[specs.findIndex((s) => s.id === id)] ?? 0,
    panelId: (i) => specs[i]?.id,
    panelDomId: (i) => {
      const id = specs[i]?.id;
      return id === undefined ? undefined : root?.querySelector<HTMLElement>(`[data-panel-id="${CSS.escape(id)}"]`)?.id;
    },
    bounds(i) {
      const a = specs[i];
      const b = specs[i + 1];
      if (!a || !b) return { min: 0, max: 100 };
      const pair = (sizes[i] ?? 0) + (sizes[i + 1] ?? 0);
      return { min: Math.max(a.min, pair - b.max), max: Math.min(a.max, pair - b.min) };
    },
    value: (i) => sizes[i] ?? 0,
    resizeTo(i, percent, settle) {
      sizes = moveBoundary(sizes, specs, i, percent);
      if (settle) emit();
    },
    commit: emit,
    extent() {
      const r = root?.getBoundingClientRect();
      return (direction === 'horizontal' ? r?.width : r?.height) ?? 0;
    },
    handleIndex(el) {
      const all = root ? Array.from(root.querySelectorAll('[role="separator"]')) : [];
      return all.indexOf(el);
    },
  };
  setContext<SplitterContext>(SPLITTER_KEY, ctx);

  // `dragging` is only a styling hook: no text selection while a handle holds the pointer.
  export function setDragging(v: boolean) {
    dragging = v;
  }
</script>

<div
  {...rest}
  bind:this={root}
  role="group"
  aria-label={label}
  class="ca-resizable {className}"
  data-direction={direction}
  data-dragging={dragging ? '' : undefined}
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-resizable {
      display: flex;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }
    .ca-resizable[data-direction='vertical'] { flex-direction: column; }
    .ca-resizable[data-dragging] { user-select: none; }
}
</style>
