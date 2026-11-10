<script lang="ts">
	import Badge from "./Badge.svelte";

	const counters = ["brand", "success", "error", "warning"] as const;
	const pills = ["brand", "success", "danger", "warning", "info", "neutral"] as const;
</script>

<div style="display:flex;flex-direction:column;gap:16px;padding:24px;width:max-content">
	<div style="display:flex;gap:24px">
		{#each counters as color (color)}
			<Badge count={7} {color}>
				<span style="display:block;width:32px;height:32px;border-radius:8px;background:#888"></span>
			</Badge>
		{/each}
	</div>
	<div style="display:flex;gap:8px">
		{#each pills as tone (tone)}
			<Badge {tone}>{tone} pill</Badge>
		{/each}
	</div>
</div>
