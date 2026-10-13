<script lang="ts">
	import { Time } from "@internationalized/date";
	import TimeField from "./TimeField.svelte";

	const time = new Time(14, 30);
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<TimeField label="Empty" placeholder={new Time(9, 0)} />
	<TimeField label="Filled" value={time} />
	<TimeField label="Small" size="sm" value={time} />
	<TimeField label="Description" description="Start time" value={time} />
	<TimeField label="Error" error="Invalid time" value={time} />
	<TimeField label="Required" required placeholder={new Time(9, 0)} />
	<TimeField label="Disabled" disabled value={time} />
	<TimeField label="Read only" readonly value={time} />
	<TimeField label="Seconds" granularity="second" value={new Time(14, 30, 45)} />
	<TimeField label="Hour" granularity="hour" value={time} />
	<TimeField label="12h" hourCycle={12} value={time} />
</div>
