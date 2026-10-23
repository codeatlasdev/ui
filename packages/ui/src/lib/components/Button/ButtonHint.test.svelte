<script lang="ts">
	import Button from "./Button.svelte";
	import Kbd from "../Kbd/Kbd.svelte";

	interface Props {
		trailingHint?: boolean;
		align?: "center" | "between";
		loading?: boolean;
		fullWidth?: boolean;
		withTrailing?: boolean;
	}
	let { trailingHint = false, align, loading = false, fullWidth = false, withTrailing = true }: Props = $props();
</script>

{#snippet hint()}<Kbd>K</Kbd>{/snippet}

<Button {trailingHint} {align} {loading} {fullWidth} trailing={withTrailing ? hint : undefined}>Next lead</Button>
