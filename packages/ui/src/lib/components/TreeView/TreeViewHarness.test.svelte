<script lang="ts">
	import TreeView, { type TreeNode } from "./TreeView.svelte";

	let { lazy = false }: { lazy?: boolean } = $props();
	let selected = $state<string>();
	const nodes: TreeNode[] = $derived([
		{ id: "src", label: "src", children: [{ id: "lib", label: "lib", children: [{ id: "a", label: "a.ts" }] }, { id: "b", label: "b.ts" }] },
		{ id: "docs", label: "docs", hasChildren: lazy, children: lazy ? undefined : [{ id: "readme", label: "README.md" }] },
		{ id: "pkg", label: "package.json" },
	]);
	const loadChildren = async (n: TreeNode): Promise<TreeNode[]> => [{ id: `${n.id}-x`, label: "intro.md" }];
</script>

<TreeView aria-label="Files" {nodes} bind:selected loadChildren={lazy ? loadChildren : undefined} />
<output data-testid="selected">{selected ?? ""}</output>
