<script lang="ts">
	import CardGrid from "./CardGrid.svelte";
	import LinkCard from "./LinkCard.svelte";
</script>

<div data-testid="matrix" style="padding:16px;width:900px">
	<CardGrid>
		{#snippet children()}
			<LinkCard title="Getting started" description="Install and configure in minutes." href="#a" />
			<LinkCard title="Authentication" description="Tokens, scopes and security best practices." href="#b" />
			<LinkCard title="No description" href="#c" />
			<LinkCard
				title="A very long title to check line wrapping inside the card"
				description="A long description too, to check the minimum height and the arrow alignment at the end of the title."
				href="#d"
			/>
		{/snippet}
	</CardGrid>
</div>
