<script lang="ts">
	import { Time } from "@internationalized/date";
	import TimePicker from "./TimePicker.svelte";

	const time = new Time(14, 30);
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<TimePicker label="Empty" placeholder={new Time(9, 0)} />
	<TimePicker label="Filled" value={time} />
	<TimePicker label="Small" size="sm" value={time} />
	<TimePicker label="Description" description="Start time" value={time} />
	<TimePicker label="Error" error="Invalid time" value={time} />
	<TimePicker label="Required" required placeholder={new Time(9, 0)} />
	<TimePicker label="Disabled" disabled value={time} />
	<TimePicker label="Read only" readonly value={time} />
	<TimePicker label="12h" hourCycle={12} locale="en-US" value={time} />
	<TimePicker label="Hour" granularity="hour" value={time} />
</div>
