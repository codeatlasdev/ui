<script lang="ts">
	import Button from "../Button/Button.svelte";
	import GlassCard from "../GlassCard/GlassCard.svelte";
	import PageShell from "./PageShell.svelte";
</script>

<div
	data-testid="matrix"
	style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden"
>
	<PageShell title="Dashboard" description="Workspace overview.">
		{#snippet actions()}
			<Button>Export</Button>
		{/snippet}
		<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
			<GlassCard><p style="margin:0">Revenue</p></GlassCard>
			<GlassCard><p style="margin:0">Users</p></GlassCard>
			<GlassCard><p style="margin:0">Conversion</p></GlassCard>
		</div>
	</PageShell>
</div>
