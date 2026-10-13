<script lang="ts">
	import { AlignCenter, AlignLeft, AlignRight } from "@lucide/svelte";
	import ToggleGroup from "./ToggleGroup.svelte";

	const textItems = [
		{ value: "a", label: "Day" },
		{ value: "b", label: "Week" },
		{ value: "c", label: "Month", disabled: true },
	];
	const iconItems = [
		{ value: "left", icon: AlignLeft, "aria-label": "Left" },
		{ value: "center", icon: AlignCenter, "aria-label": "Center" },
		{ value: "right", icon: AlignRight, "aria-label": "Right" },
	];
	const mixedItems = [
		{ value: "left", icon: AlignLeft, label: "Left" },
		{ value: "center", icon: AlignCenter, label: "Center" },
		{ value: "right", icon: AlignRight, label: "Right" },
	];
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,max-content);align-items:start"
>
	<ToggleGroup items={textItems} value="a" aria-label="Outlined single" />
	<ToggleGroup items={textItems} variant="ghost" value="b" aria-label="Ghost single" />
	<ToggleGroup items={textItems} size="sm" value="a" aria-label="Small" />
	<ToggleGroup items={textItems} aria-label="No selection" />
	<ToggleGroup items={iconItems} type="multiple" value={["left", "right"]} aria-label="Multiple" />
	<ToggleGroup items={iconItems} type="multiple" variant="ghost" value={["center"]} aria-label="Multiple ghost" />
	<ToggleGroup items={mixedItems} value="center" aria-label="Icon and label" />
	<ToggleGroup items={mixedItems} size="sm" variant="ghost" value="left" aria-label="Icon and label small" />
	<ToggleGroup items={textItems} orientation="vertical" value="a" aria-label="Vertical" />
	<ToggleGroup items={textItems} disabled value="a" aria-label="Disabled" />
</div>
