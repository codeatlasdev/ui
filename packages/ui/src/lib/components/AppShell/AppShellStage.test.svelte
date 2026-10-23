<script lang="ts">
	import { Home, Settings, Users } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import type { NavModule } from "./types.js";

	interface Props {
		stage?: boolean;
		stageVisible?: boolean;
	}
	let { stage = true, stageVisible = true }: Props = $props();

	const paths = ["/app/a", "/app/b", "/app/c"];
	const modules: NavModule[] = [
		{
			id: "app",
			label: "Application",
			icon: Home,
			basePath: "/app",
			items: [
				{ id: "a", label: "Alpha", icon: Home, path: paths[0] },
				{ id: "b", label: "Beta", icon: Users, path: paths[1] },
				{ id: "c", label: "Gamma", icon: Settings, path: paths[2] },
			],
		},
	];

	let pathname = $state(paths[0]);
	export function go(path: string) {
		pathname = path;
	}

	// Counts how many times the stage was created / destroyed, and what it was told.
	const stats = { mounts: 0, destroys: 0, hidden: false, clicks: 0 };
	export function getStats() {
		return stats;
	}
	function track(node: HTMLElement) {
		stats.mounts += 1;
		return () => {
			stats.destroys += 1;
		};
	}
</script>

<AppShellLayout {modules} {pathname} onNavigate={go} persistPanel={false} {stageVisible} stage={stage ? stageSnippet : undefined}>
	<div class="ca-stage-panel panel">
		<h1>{pathname}</h1>
	</div>
</AppShellLayout>

{#snippet stageSnippet(s: { hidden: boolean })}
	<div
		{@attach track}
		data-testid="stage"
		class="stage"
		role="presentation"
		onclick={() => (stats.clicks += 1)}
	>
		{(stats.hidden = s.hidden)}
	</div>
{/snippet}

<style>
	.stage { position: absolute; inset: 0; }
	.panel { width: 120px; height: 60px; }
</style>
