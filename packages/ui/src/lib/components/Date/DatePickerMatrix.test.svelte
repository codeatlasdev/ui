<script lang="ts">
	import { CalendarDate } from "@internationalized/date";
	import DatePicker from "./DatePicker.svelte";

	const date = new CalendarDate(2026, 1, 15);
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<DatePicker label="Empty" placeholder={date} />
	<DatePicker label="Filled" value={date} />
	<DatePicker label="Small" size="sm" value={date} />
	<DatePicker label="Description" description="Date of birth" value={date} />
	<DatePicker label="Error" error="Invalid date" value={date} />
	<DatePicker label="Required" required placeholder={date} />
	<DatePicker label="Disabled" disabled value={date} />
	<DatePicker label="Read only" readonly value={date} />
	<DatePicker label="Minute granularity" granularity="minute" value={date} />
	<DatePicker label="Locale en-US" locale="en-US" value={date} />
</div>
