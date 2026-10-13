<script lang="ts">
	import StatusChip from "./StatusChip.svelte";

	const statuses = ["success", "warning", "error", "info", "neutral"] as const;
</script>

<div data-testid="matrix" style="display:flex;flex-wrap:wrap;gap:12px;padding:16px;width:480px">
	{#each statuses as status (status)}
		<StatusChip {status} label={status} />
	{/each}
	<StatusChip status="info" label="A much longer status label" />
</div>
