<script lang="ts">
	import AppForm from "../AppForm/AppForm.svelte";
	import AppSettings from "../AppSettings/AppSettings.svelte";
	import PageFrame from "./PageFrame.svelte";

	let {
		kind,
		asideWidth,
		asideLabel,
		withAside = true,
	}: {
		kind: "frame" | "form" | "settings";
		asideWidth?: string;
		asideLabel?: string;
		withAside?: boolean;
	} = $props();

	const tabs = [{ value: "general", label: "General" }];
</script>

{#snippet aside()}
	<p data-testid="aside-content">Preview</p>
{/snippet}
{#snippet body()}
	<p data-testid="content">Content</p>
{/snippet}
{#snippet tabBody(_tab: string)}
	<p data-testid="content">Content</p>
{/snippet}

<main style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden;position:relative">
	{#if kind === "frame"}
		<PageFrame mode="page" label="Settings" {asideWidth} {asideLabel} aside={withAside ? aside : undefined} children={body} />
	{:else if kind === "form"}
		<AppForm title="Edit" {asideWidth} {asideLabel} aside={withAside ? aside : undefined} children={body} />
	{:else}
		<AppSettings title="Settings" {tabs} {asideWidth} {asideLabel} aside={withAside ? aside : undefined} children={tabBody} />
	{/if}
</main>
