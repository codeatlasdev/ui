<script lang="ts">
	import { Star } from "@lucide/svelte";
	import Chip from "./Chip.svelte";

	const variants = ["default", "brand", "success", "info", "warning", "error"] as const;
	const sizes = ["sm", "md"] as const;
</script>

<div data-testid="matrix" style="display:grid;gap:12px;padding:16px;width:max-content">
	{#each sizes as size (size)}
		{#each variants as variant (variant)}
			<div style="display:flex;gap:8px;align-items:center">
				<Chip label={variant} {variant} {size} />
				<Chip label={variant} {variant} {size} selected />
				<Chip label={variant} {variant} {size} icon={Star} />
				<Chip label={variant} {variant} {size} deletable />
				<Chip label={variant} {variant} {size} onclick={() => {}} />
			</div>
		{/each}
	{/each}
	<div style="width:160px">
		<Chip label="A very long label that should wrap or truncate" />
	</div>
</div>
