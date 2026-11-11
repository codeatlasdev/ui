<script lang="ts">
	import Card from "../Card/Card.svelte";
	import CenteredPage from "./CenteredPage.svelte";
</script>

<div data-testid="matrix" style="width:360px;height:520px;overflow:auto">
	<CenteredPage maxWidth="sm" mainId={null}>
		{#snippet brand()}<strong>Acme</strong>{/snippet}
		<Card>Invite accepted</Card>
	</CenteredPage>
</div>
