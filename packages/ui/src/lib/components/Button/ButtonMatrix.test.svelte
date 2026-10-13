<script lang="ts">
	import { Plus } from "@lucide/svelte";
	import Button from "./Button.svelte";
	import IconButton from "./IconButton.svelte";

	const variants = ["filled", "glass", "outlined", "ghost", "destructive"] as const;
	const sizes = ["sm", "md", "lg"] as const;
	const iconVariants = ["glass", "filled", "text"] as const;
</script>

{#snippet label()}Save{/snippet}
{#snippet icon()}<Plus size={16} />{/snippet}
{#snippet iconLg()}<Plus size={20} />{/snippet}

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:max-content;grid-template-columns:repeat(3,max-content)"
>
	{#each variants as variant}
		{#each sizes as size}
			<Button {variant} {size}>{@render label()}</Button>
		{/each}
		<Button {variant} disabled>{@render label()}</Button>
		<Button {variant} loading>{@render label()}</Button>
		<Button {variant} leading={icon} trailing={icon}>{@render label()}</Button>
	{/each}
	<Button fullWidth>Full width</Button>
	<Button href="/x">Link</Button>
	<Button disabled href="/x">Link off</Button>

	{#each iconVariants as variant}
		{#each sizes as size}
			<IconButton {variant} {size} aria-label="Add">{@render iconLg()}</IconButton>
		{/each}
		<IconButton {variant} disabled aria-label="Add">{@render icon()}</IconButton>
		<IconButton {variant} loading aria-label="Add">{@render icon()}</IconButton>
		<span></span>
	{/each}
</div>
