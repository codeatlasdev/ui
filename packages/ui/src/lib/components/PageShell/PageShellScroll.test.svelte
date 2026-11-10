<script lang="ts">
	import { Home } from "@lucide/svelte";
	import AppShellLayout from "../AppShell/AppShellLayout.svelte";
	import type { NavModule } from "../AppShell/types.js";
	import PageShell from "./PageShell.svelte";

	let { shell = true }: { shell?: boolean } = $props();
	const modules: NavModule[] = [
		{ id: "a", label: "A", icon: Home, basePath: "/a", items: [{ id: "1", label: "One", icon: Home, path: "/a/1" }] },
	];
	const rows = Array.from({ length: 80 }, (_, i) => i);
</script>

{#snippet page()}
	<PageShell title="Records">
		{#each rows as r (r)}
			<p style="margin:0;height:40px">Row {r}</p>
		{/each}
		<!-- A visually hidden label at the end, like RecordCell's dt or Checkbox's native input. -->
		<span class="ca-sr-only" data-testid="hidden-end">Hidden label</span>
	</PageShell>
{/snippet}

{#if shell}
	<AppShellLayout {modules} pathname="/a/1" persistPanel={false} skipLink={false}>{@render page()}</AppShellLayout>
{:else}
	<div style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden">{@render page()}</div>
{/if}
