<script lang="ts" module>
  export interface TreeNode {
    id: string;
    label: string;
    /** Loaded children. Omit and set `hasChildren` to load them on first expand. */
    children?: TreeNode[];
    hasChildren?: boolean;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import Spinner from '../Spinner/Spinner.svelte';

  interface Props {
    nodes: TreeNode[];
    /** Accessible name of the tree. */
    'aria-label': string;
    /** Bindable selected node id. */
    selected?: string;
    /** Bindable expanded node ids. */
    expanded?: string[];
    /** Loads a node's children on first expand (lazy tree). */
    loadChildren?: (node: TreeNode) => Promise<TreeNode[]>;
    onselect?: (node: TreeNode) => void;
    class?: string;
  }

  let {
    nodes,
    'aria-label': ariaLabel,
    selected = $bindable(),
    expanded = $bindable([]),
    loadChildren,
    onselect,
    class: className = '',
  }: Props = $props();

  // Children fetched by loadChildren, by node id.
  let loaded = $state<Record<string, TreeNode[]>>({});
  let loading = $state<Record<string, boolean>>({});
  let focusId = $state<string | undefined>();

  const kids = (n: TreeNode) => n.children ?? loaded[n.id];
  const branch = (n: TreeNode) => !!(n.children?.length || n.hasChildren);
  const isOpen = (n: TreeNode) => expanded.includes(n.id);

  /** Visible nodes in document order, with their parent: what the arrow keys walk. */
  const visible = $derived.by(() => {
    const out: { node: TreeNode; parent?: TreeNode }[] = [];
    const walk = (list: TreeNode[], parent?: TreeNode) => {
      for (const node of list) {
        out.push({ node, parent });
        if (isOpen(node)) walk(kids(node) ?? [], node);
      }
    };
    walk(nodes);
    return out;
  });
  // Tab lands on the selected node, else the first.
  const tabId = $derived(focusId ?? (visible.some((v) => v.node.id === selected) ? selected : visible[0]?.node.id));

  async function open(n: TreeNode) {
    if (!branch(n) || isOpen(n)) return;
    expanded = [...expanded, n.id];
    if (!kids(n) && loadChildren) {
      loading[n.id] = true;
      try {
        loaded[n.id] = await loadChildren(n);
      } finally {
        loading[n.id] = false;
      }
    }
  }
  function close(n: TreeNode) {
    expanded = expanded.filter((id) => id !== n.id);
  }
  function pick(n: TreeNode) {
    if (n.disabled) return;
    selected = n.id;
    onselect?.(n);
  }

  let root = $state<HTMLElement>();
  function focusNode(id: string | undefined) {
    if (!id) return;
    focusId = id;
    root?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`)?.focus();
  }

  function onkeydown(e: KeyboardEvent, n: TreeNode, parent?: TreeNode) {
    const i = visible.findIndex((v) => v.node.id === n.id);
    const move = (to: number) => focusNode(visible[Math.max(0, Math.min(visible.length - 1, to))]?.node.id);
    switch (e.key) {
      case 'ArrowDown': move(i + 1); break;
      case 'ArrowUp': move(i - 1); break;
      case 'Home': move(0); break;
      case 'End': move(visible.length - 1); break;
      case 'ArrowRight':
        if (!branch(n)) return;
        if (!isOpen(n)) void open(n);
        else focusNode(kids(n)?.[0]?.id);
        break;
      case 'ArrowLeft':
        if (branch(n) && isOpen(n)) close(n);
        else if (parent) focusNode(parent.id);
        else return;
        break;
      case 'Enter':
      case ' ':
        pick(n);
        break;
      default:
        return;
    }
    e.preventDefault();
  }
</script>

{#snippet level(list: TreeNode[], depth: number, parent?: TreeNode)}
  {#each list as node, i (node.id)}
    {@const isBranch = branch(node)}
    {@const isExpanded = isOpen(node)}
    <li
      role="treeitem"
      class="ca-tree__item"
      data-node-id={node.id}
      aria-level={depth}
      aria-setsize={list.length}
      aria-posinset={i + 1}
      aria-expanded={isBranch ? isExpanded : undefined}
      aria-selected={selected === node.id}
      aria-disabled={node.disabled ? 'true' : undefined}
      aria-busy={loading[node.id] ? 'true' : undefined}
      tabindex={tabId === node.id ? 0 : -1}
      onfocus={(e) => { if (e.target === e.currentTarget) focusId = node.id; }}
      onkeydown={(e) => { if (e.target === e.currentTarget) onkeydown(e, node, parent); }}
      onclick={(e) => { e.stopPropagation(); if (isBranch) (isExpanded ? close(node) : void open(node)); pick(node); focusNode(node.id); }}
    >
      <span class="ca-tree__row" style="--ca-tree-depth:{depth - 1}">
        <span class="ca-tree__toggle" aria-hidden="true">
          {#if loading[node.id]}<Spinner size={14} />{:else if isBranch}<ChevronRight size={16} />{/if}
        </span>
        <span class="ca-tree__label">{node.label}</span>
      </span>
      {#if isBranch && isExpanded && kids(node)?.length}
        <ul role="group" class="ca-tree__group">{@render level(kids(node) ?? [], depth + 1, node)}</ul>
      {/if}
    </li>
  {/each}
{/snippet}

<ul bind:this={root} role="tree" aria-label={ariaLabel} class="ca-tree {className}">
  {@render level(nodes, 1)}
</ul>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-tree, .ca-tree__group { list-style: none; margin: 0; padding: 0; }
    .ca-tree__item { outline: none; }
    .ca-tree__row {
      display: flex;
      align-items: center;
      gap: var(--ca-space-1);
      min-height: var(--ca-tree-row-h, var(--ca-control-height-sm));
      padding-inline: calc(var(--ca-space-2) + var(--ca-tree-depth) * var(--ca-tree-indent, var(--ca-space-4))) var(--ca-space-2);
      border-radius: var(--ca-radius-sm);
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-body2);
      cursor: default;
    }
    .ca-tree__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ca-tree__toggle { display: inline-flex; flex: none; inline-size: var(--ca-space-4); justify-content: center; color: var(--ca-text-secondary); transition: transform var(--ca-duration-fast) var(--ca-ease-standard); }
    .ca-tree__item[aria-expanded='true'] > .ca-tree__row > .ca-tree__toggle { transform: rotate(90deg); }
    .ca-tree__item > .ca-tree__row:hover { background: var(--ca-action-hover); }
    .ca-tree__item[aria-selected='true'] > .ca-tree__row { background: var(--ca-action-selected); }
    .ca-tree__item:focus-visible > .ca-tree__row { outline: var(--ca-border-width-focus) solid var(--ca-focus-ring); outline-offset: calc(var(--ca-border-width-focus) * -1); }
    .ca-tree__item[aria-disabled='true'] > .ca-tree__row { color: var(--ca-text-disabled); }
    @media (pointer: coarse) { .ca-tree__row { min-height: var(--ca-touch-target); } }
    @media (prefers-reduced-motion: reduce) { .ca-tree__toggle { transition: none; } }
}
</style>
