<script lang="ts">
	import Dialog from "./Dialog.svelte";

	interface Props {
		placement?: "center" | "top";
		fullscreenBelow?: "sm" | "md";
		rows?: number;
		class?: string;
	}
	let { placement, fullscreenBelow, rows = 1, class: className = "" }: Props = $props();
	let open = $state(true);
</script>

<Dialog bind:open {placement} {fullscreenBelow} class={className} title="Search" description="Find a page.">
	{#each Array.from({ length: rows }) as _, i (i)}<p>Result {i + 1}</p>{/each}
</Dialog>
