<script lang="ts">
	import { Home, Settings } from "@lucide/svelte";
	import AppShellLayout from "../AppShell/AppShellLayout.svelte";
	import type { NavModule } from "../AppShell/types.js";
	import PageFrame from "./PageFrame.svelte";

	let { mode = "map", side = "left" }: { mode?: "map" | "split" | "page"; side?: "left" | "right" } = $props();

	const modules: NavModule[] = [
		{
			id: "a",
			label: "A",
			icon: Home,
			basePath: "/a",
			items: [
				{ id: "1", label: "One", icon: Home, path: "/a/1" },
				{ id: "2", label: "Two", icon: Settings, path: "/a/2" },
				{ id: "3", label: "Three", icon: Settings, path: "/a/3" },
			],
		},
	];
</script>

<AppShellLayout {modules} pathname="/a/1" persistPanel={false} mainId={null} skipLink={false}>
	<PageFrame {mode} {side} width="sm" label="Frame"><p>Body</p></PageFrame>
</AppShellLayout>
