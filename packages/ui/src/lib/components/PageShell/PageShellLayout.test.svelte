<script lang="ts">
	import PageShell from "./PageShell.svelte";

	let {
		width,
		withAside = false,
		asideLabel,
	}: { width?: "reading" | "wide"; withAside?: boolean; asideLabel?: string } = $props();
</script>

{#snippet aside()}
	<nav aria-label="On this page"><a href="#a">Profile</a></nav>
{/snippet}

<div style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden">
	<PageShell title="Settings" description="Workspace settings." {width} {asideLabel} aside={withAside ? aside : undefined}>
		<p data-testid="content">Content</p>
	</PageShell>
</div>
