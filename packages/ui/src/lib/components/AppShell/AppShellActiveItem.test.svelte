<script lang="ts">
	import { FileText, LayoutGrid } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import type { NavModule } from "./types.js";

	let { pathname = "/items/a" }: { pathname?: string } = $props();

	// An overview item and a more specific one, the second inside a section, in overview-first order.
	const modules: NavModule[] = [
		{
			id: "items",
			label: "Items",
			icon: LayoutGrid,
			basePath: "/items",
			items: [
				{ id: "all", label: "All items", icon: LayoutGrid, path: "/items" },
				{ label: "Recent", items: [{ id: "a", label: "Item A", icon: FileText, path: "/items/a" }] },
			],
		},
	];
</script>

<AppShellLayout {modules} {pathname} onNavigate={() => {}} />
