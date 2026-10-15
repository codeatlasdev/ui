<script lang="ts">
	import { FileText, Home, Settings, Users } from "@lucide/svelte";
	import SiteHeader from "../SiteHeader/SiteHeader.svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import type { NavModule } from "./types.js";

	const modules: NavModule[] = [
		{
			id: "app",
			label: "Application",
			icon: Home,
			basePath: "/app",
			items: [
				{ id: "dash", label: "Dashboard", icon: Home, path: "/app/dashboard" },
				{ id: "docs", label: "Documents", icon: FileText, path: "/app/docs", badge: 3 },
				{
					label: "Admin",
					items: [{ id: "usr", label: "Users", icon: Users, path: "/app/users", isNew: true }],
				},
			],
		},
		{
			id: "cfg",
			label: "Settings",
			icon: Settings,
			basePath: "/settings",
			items: [
				{ id: "gen", label: "General", icon: Settings, path: "/settings/general" },
				{ id: "sec", label: "Security", icon: Settings, path: "/settings/security" },
			],
		},
	];
</script>

<!-- transform creates the containing block for the shell's position:fixed sidebar / bottom nav. -->
<div
	data-testid="matrix"
	style="position:relative;width:100vw;height:100vh;overflow:hidden;transform:translateZ(0)"
>
	<AppShellLayout {modules} pathname="/app/dashboard" persistPanel={false}>
		{#snippet header()}
			<SiteHeader />
		{/snippet}
		{#snippet brand()}
			<span style="font-weight:700">CA</span>
		{/snippet}
		<div style="padding:24px">
			<h1 style="margin:0 0 8px">Dashboard</h1>
			<p style="margin:0">Page content.</p>
		</div>
	</AppShellLayout>
</div>
