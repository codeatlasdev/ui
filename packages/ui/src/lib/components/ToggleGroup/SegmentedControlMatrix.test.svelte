<script lang="ts">
	import { LayoutGrid, List } from "@lucide/svelte";
	import SegmentedControl from "./SegmentedControl.svelte";

	const items = [
		{ value: "a", label: "Daily" },
		{ value: "b", label: "Weekly" },
		{ value: "c", label: "Monthly" },
	];
	const withDisabled = [
		{ value: "a", label: "Daily" },
		{ value: "b", label: "Weekly", disabled: true },
		{ value: "c", label: "Monthly" },
	];
	const icons = [
		{ value: "grid", icon: LayoutGrid, label: "Grid" },
		{ value: "list", icon: List, label: "List" },
	];
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:560px;justify-items:start"
>
	<SegmentedControl {items} value="a" aria-label="First" />
	<SegmentedControl {items} value="b" aria-label="Second" />
	<SegmentedControl {items} value="c" aria-label="Third" />
	<SegmentedControl {items} size="sm" value="b" aria-label="Small" />
	<SegmentedControl items={withDisabled} value="a" aria-label="Disabled item" />
	<SegmentedControl items={icons} value="list" aria-label="With icons" />
	<SegmentedControl {items} value="b" fullWidth aria-label="Full width" />
	<SegmentedControl {items} value="a" disabled aria-label="Disabled" />
</div>
