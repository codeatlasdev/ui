<script lang="ts">
	import { CalendarDate } from "@internationalized/date";
	import Calendar from "./Calendar.svelte";
	import RangeCalendar from "./RangeCalendar.svelte";

	// A host of a fixed width (a phone card, a tablet card) around one calendar.
	let {
		width,
		fill = false,
		range = false,
		numberOfMonths,
	}: { width: number; fill?: boolean; range?: boolean; numberOfMonths?: number } = $props();

	const placeholder = new CalendarDate(2026, 3, 10);
</script>

<div class="host" data-testid="host" style="--host-w: {width}px">
	{#if range}
		<RangeCalendar {fill} {placeholder} {numberOfMonths} label="Stay" />
	{:else}
		<Calendar {fill} {placeholder} label="Date" />
	{/if}
</div>

<style>
	.host {
		width: var(--host-w);
	}
</style>
