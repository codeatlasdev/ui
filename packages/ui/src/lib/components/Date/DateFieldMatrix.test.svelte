<script lang="ts">
	import { CalendarDate, CalendarDateTime } from "@internationalized/date";
	import DateField from "./DateField.svelte";

	const date = new CalendarDate(2026, 1, 15);
	const dateTime = new CalendarDateTime(2026, 1, 15, 14, 30);
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<DateField label="Empty" placeholder={date} />
	<DateField label="Filled" value={date} />
	<DateField label="Small" size="sm" value={date} />
	<DateField label="Description" description="Date of birth" value={date} />
	<DateField label="Error" error="Invalid date" value={date} />
	<DateField label="Required" required placeholder={date} />
	<DateField label="Disabled" disabled value={date} />
	<DateField label="Read only" readonly value={date} />
	<DateField label="Minute" granularity="minute" value={dateTime} />
	<DateField label="12h" granularity="minute" hourCycle={12} value={dateTime} />
	<DateField label="Locale en-US" locale="en-US" value={date} />
</div>
