<script lang="ts">
	import { Home, FileText, Users } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import LoadingBoundary from "../LoadingBoundary/LoadingBoundary.svelte";
	import type { NavModule } from "./types.js";

	const paths = ["/app/dashboard", "/app/docs", "/app/users", "/app/reports/weekly"];
	const modules: NavModule[] = [
		{
			id: "app",
			label: "Application",
			icon: Home,
			basePath: "/app",
			items: [
				{ id: "dash", label: "Dashboard", icon: Home, path: paths[0] },
				{ id: "docs", label: "Documents", icon: FileText, path: paths[1] },
				{ label: "Admin", items: [{ id: "usr", label: "Users", icon: Users, path: paths[2] }] },
				{ label: "Reports", items: [{ id: "rep", label: "Weekly", icon: FileText, path: paths[3] }] },
			],
		},
	];

	let pathname = $state(paths[0]);
	/** What a router does: the URL changes, the layout stays. */
	export function go(path: string) {
		pathname = path;
	}
	let mounts = 0;
	export function mountCount() {
		return mounts;
	}
	// Counts every time the page body (a child of the shell) is created.
	function page() {
		mounts += 1;
	}
</script>

<AppShellLayout {modules} {pathname} onNavigate={go}>
	<LoadingBoundary delay={0} minDuration={0}>
		{#key pathname}
			<section {@attach page} data-testid="page"><h1>{pathname}</h1></section>
		{/key}
	</LoadingBoundary>
</AppShellLayout>
