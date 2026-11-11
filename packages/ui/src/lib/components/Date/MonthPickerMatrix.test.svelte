<script lang="ts">
	import { CalendarDate } from "@internationalized/date";
	import MonthPicker from "./MonthPicker.svelte";

	const month = new CalendarDate(2026, 1, 1);
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<MonthPicker label="Empty" placeholder={month} />
	<MonthPicker label="Filled" value={month} />
	<MonthPicker label="Small" size="sm" value={month} />
	<MonthPicker label="Description" description="Billing month" value={month} />
	<MonthPicker label="Error" error="Invalid month" value={month} />
	<MonthPicker label="Required" required placeholder={month} />
	<MonthPicker label="Disabled" disabled value={month} />
	<MonthPicker label="Read only" readonly value={month} />
	<MonthPicker label="Locale en-US" locale="en-US" value={month} />
</div>
