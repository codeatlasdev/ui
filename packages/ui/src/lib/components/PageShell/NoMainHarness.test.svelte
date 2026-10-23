<script lang="ts">
	import AppShellLayout from "../AppShell/AppShellLayout.svelte";
	import PageFrame from "../PageFrame/PageFrame.svelte";
	import PageShell from "./PageShell.svelte";

	let { where = "alone", frame = false }: { where?: "alone" | "main" | "role" | "shell" | "elsewhere"; frame?: boolean } = $props();
</script>

{#snippet page()}
	{#if frame}
		<PageFrame label="Frame"><p>Body</p></PageFrame>
	{:else}
		<PageShell title="Page"><p>Body</p></PageShell>
	{/if}
{/snippet}

{#if where === "main"}
	<main>{@render page()}</main>
{:else if where === "role"}
	<div role="main">{@render page()}</div>
{:else if where === "elsewhere"}
	<main><p>The page owns the landmark outside the layout.</p></main>
	<div>{@render page()}</div>
{:else if where === "shell"}
	<AppShellLayout modules={[]} pathname="/" persistPanel={false} skipLink={false}>{@render page()}</AppShellLayout>
{:else}
	<div>{@render page()}</div>
{/if}
