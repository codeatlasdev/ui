<script lang="ts">
	import { Home, Settings } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import type { NavModule } from "./types.js";

	let { collapseShortPanel, leaves = 2 }: { collapseShortPanel?: boolean; leaves?: number } = $props();

	const modules: NavModule[] = $derived([
		{
			id: "settings",
			label: "Settings",
			icon: Settings,
			basePath: "/settings",
			items: [
				{ id: "a", label: "Profile", icon: Home, path: "/settings/profile" },
				{ id: "b", label: "Billing", icon: Home, path: "/settings/billing" },
				...(leaves > 2 ? [{ id: "c", label: "Team", icon: Home, path: "/settings/team" }] : []),
			],
		},
	]);
</script>

<AppShellLayout {modules} pathname="/settings/profile" persistPanel={false} {collapseShortPanel}>
	<p>Page</p>
</AppShellLayout>
