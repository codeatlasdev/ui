<script lang="ts">
	import AlertDialog from "../AlertDialog/AlertDialog.svelte";
	import Combobox from "../Combobox/Combobox.svelte";
	import CommandPalette from "../CommandPalette/CommandPalette.svelte";
	import DatePicker from "../Date/DatePicker.svelte";
	import DateRangePicker from "../Date/DateRangePicker.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import DocsSearch from "../Docs/DocsSearch.svelte";
	import Drawer from "../Drawer/Drawer.svelte";
	import DropdownMenu from "../DropdownMenu/DropdownMenu.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import Lightbox from "../Lightbox/Lightbox.svelte";
	import NotificationBell from "../NotificationBell/NotificationBell.svelte";
	import Popover from "../Popover/Popover.svelte";
	import Select from "../Select/Select.svelte";
	import Sheet from "../Sheet/Sheet.svelte";
	import Tooltip from "../Tooltip/Tooltip.svelte";

	let { only }: { only?: string } = $props();
	const show = (name: string) => !only || only === name;
	const options = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];
</script>

{#if show("Dialog")}<Dialog title="T">body</Dialog>{/if}
{#if show("AlertDialog")}<AlertDialog title="T" onconfirm={() => {}} />{/if}
{#if show("Drawer")}<Drawer title="T">body</Drawer>{/if}
{#if show("Sheet")}<Sheet title="T">body</Sheet>{/if}
{#if show("Lightbox")}<Lightbox src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="x" />{/if}
{#if show("CommandPalette")}<CommandPalette modules={[]} onNavigate={() => {}} />{/if}
{#if show("DocsSearch")}<DocsSearch index={[]} onselect={() => {}} />{/if}
{#if show("DropdownMenu")}
	<DropdownMenu>
		{#snippet trigger()}Actions{/snippet}
		<DropdownMenuItem>Edit</DropdownMenuItem>
	</DropdownMenu>
{/if}
{#if show("Popover")}
	<Popover>
		{#snippet trigger()}Details{/snippet}
		<p>content</p>
	</Popover>
{/if}
{#if show("Select")}<Select label="Letter" {options} />{/if}
{#if show("Combobox")}<Combobox label="Letter" {options} />{/if}
{#if show("Tooltip")}<Tooltip content="Tip">Hover</Tooltip>{/if}
{#if show("NotificationBell")}<NotificationBell notifications={[]} />{/if}
{#if show("DatePicker")}<DatePicker label="Day" />{/if}
{#if show("DateRangePicker")}<DateRangePicker label="Range" />{/if}
