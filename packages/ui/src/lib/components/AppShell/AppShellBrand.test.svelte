<script lang="ts">
	import { Home } from "@lucide/svelte";
	import AppShellLayout from "./AppShellLayout.svelte";
	import type { NavModule } from "./types.js";

	interface Props {
		brandHref?: string;
		brandLabel?: string;
		/** The consumer's own 28px link inside `brand` (what the shell should warn about). */
		ownLink?: boolean;
	}
	let { brandHref, brandLabel, ownLink = false }: Props = $props();
	const modules: NavModule[] = [
		{ id: "app", label: "Application", icon: Home, basePath: "/app", items: [{ id: "d", label: "Dashboard", icon: Home, path: "/app/dashboard" }] },
	];
</script>

<AppShellLayout {modules} pathname="/app/dashboard" persistPanel={false} {brandHref} {brandLabel}>
	{#snippet brand()}
		{#if ownLink}
			<a href="/app/dashboard" aria-label="Home" style="display:block;width:28px;height:28px;background:currentColor"></a>
		{:else}
			<span data-testid="logo" style="display:block;width:28px;height:28px;background:currentColor"></span>
		{/if}
	{/snippet}
	<h1>Page</h1>
</AppShellLayout>
