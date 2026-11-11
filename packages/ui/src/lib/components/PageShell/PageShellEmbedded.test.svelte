<script lang="ts">
	import PageShell from "./PageShell.svelte";
	import AppSettings from "../AppSettings/AppSettings.svelte";
	import AppList from "../AppList/AppList.svelte";
	import AppForm from "../AppForm/AppForm.svelte";

	let { kind, embedded = true }: { kind: "settings" | "list" | "form"; embedded?: boolean } = $props();
	const tabs = [{ value: "a", label: "General" }];
</script>

{#snippet content()}<p>Body</p>{/snippet}

<main style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden">
	<PageShell title="Page title" description="Page description">
		{#if kind === "settings"}
			<AppSettings title="Inner title" description="Inner description" {tabs} {embedded} children={content} />
		{:else if kind === "list"}
			<AppList title="Inner title" description="Inner description" {embedded} children={content} />
		{:else}
			<AppForm title="Inner title" description="Inner description" {embedded} children={content} />
		{/if}
	</PageShell>
</main>
