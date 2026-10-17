<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";

	interface Props {
		onOpenChange?: (open: boolean) => void;
		onrename?: () => void;
	}
	let { onOpenChange, onrename }: Props = $props();

	let open = $state(false);
	let point = $state<{ x: number; y: number } | null>(null);

	function oncontextmenu(e: MouseEvent) {
		e.preventDefault();
		point = { x: e.clientX, y: e.clientY };
		open = true;
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
		e.preventDefault();
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		point = { x: r.left + 8, y: r.bottom };
		open = true;
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	data-testid="area"
	role="application"
	aria-label="Explorer"
	tabindex="0"
	style="width:300px;height:200px;margin:40px"
	{oncontextmenu}
	{onkeydown}
>
	Right-click me
</div>
<button type="button" onclick={() => (open = !open)}>Toggle</button>
<output data-testid="open">{open}</output>

<DropdownMenu bind:open anchor={point} {onOpenChange}>
	<DropdownMenuItem onclick={onrename}>Rename</DropdownMenuItem>
	<DropdownMenuItem>Delete</DropdownMenuItem>
</DropdownMenu>
