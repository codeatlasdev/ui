<script lang="ts">
	import { CalendarDate } from "@internationalized/date";
	import DateRangePicker from "./DateRangePicker.svelte";

	const date = new CalendarDate(2026, 1, 15);
	const range = { start: new CalendarDate(2026, 1, 12), end: new CalendarDate(2026, 1, 18) };
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:960px;grid-template-columns:repeat(2,1fr)"
>
	<DateRangePicker label="Empty" placeholder={date} />
	<DateRangePicker label="Filled" value={range} />
	<DateRangePicker label="Small" size="sm" value={range} />
	<DateRangePicker label="Description" description="Report period" value={range} />
	<DateRangePicker label="Error" error="Invalid period" value={range} />
	<DateRangePicker label="Required" required placeholder={date} />
	<DateRangePicker label="Disabled" disabled value={range} />
	<DateRangePicker label="Read only" readonly value={range} />
</div>
