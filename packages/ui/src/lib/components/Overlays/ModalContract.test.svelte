<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import DropdownMenu from "../DropdownMenu/DropdownMenu.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import Popover from "../Popover/Popover.svelte";
	import Select from "../Select/Select.svelte";
	import Tooltip from "../Tooltip/Tooltip.svelte";

	let open = $state(false);
	let background = $state(0);
	let picked = $state("a");
</script>

<svelte:window onkeydown={(e) => e.key === "k" && e.metaKey && (open = true)} />

<div id="app-shell" style="transform: translateZ(0); contain: layout paint; overflow: hidden; position: relative;">
	<button type="button" onclick={() => background++}>Background action</button>
	<output data-testid="background-count">{background}</output>
	<Button onclick={() => (open = true)}>Open dialog</Button>
	<Popover>
		{#snippet trigger()}Page popover{/snippet}
		<button type="button">Page action</button>
	</Popover>
	<Dialog bind:open title="Settings" description="Modal contract.">
		<Select
			label="Role"
			bind:value={picked}
			options={[
				{ value: "a", label: "Alpha" },
				{ value: "b", label: "Beta" },
				{ value: "c", label: "Gamma" },
			]}
		/>
		<Popover>
			{#snippet trigger()}Details{/snippet}
			<p>Popover content</p>
			<button type="button">Inner action</button>
		</Popover>
		<DropdownMenu>
			{#snippet trigger()}Actions{/snippet}
			<DropdownMenuItem>Rename</DropdownMenuItem>
		</DropdownMenu>
		<Tooltip content="Helpful hint" delay={0}>Hint</Tooltip>
	</Dialog>
</div>
<output data-testid="picked">{picked}</output>
