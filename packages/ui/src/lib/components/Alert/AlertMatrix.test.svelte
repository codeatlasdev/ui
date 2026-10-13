<script lang="ts">
	import Alert from "./Alert.svelte";

	const severities = ["info", "success", "warning", "error"] as const;
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(2,420px);gap:16px;padding:16px;width:max-content"
>
	{#each severities as severity (severity)}
		<Alert {severity}>{severity} message</Alert>
		<Alert {severity} title="{severity} title" closable>
			Description with a title and a close button.
		</Alert>
	{/each}
	<Alert severity="warning" title="Long text">
		This is a fairly long message to check line wrapping inside the alert, making sure the icon
		and the side bar follow the content height without misaligning.
	</Alert>
	<Alert severity="info" title="Title only" />
</div>
