<script lang="ts">
	import Checkbox from "../Checkbox/Checkbox.svelte";
	import Select from "../Select/Select.svelte";
	import Switch from "../Switch/Switch.svelte";
	import RadioGroup from "./RadioGroup.svelte";

	// The four controls with a `name` inside one native <form>, so `new FormData(form)` shows what a
	// plain submit (no JS, or SvelteKit `use:enhance`) would send.
	let { names = true }: { names?: boolean } = $props();
	let segment = $state("pro");
	let agree = $state(true);
	let alerts = $state(true);
	let plan = $state("b");
</script>

<form data-testid="form">
	<RadioGroup
		bind:value={segment}
		name={names ? "segment" : undefined}
		aria-label="Segment"
		items={[
			{ value: "free", label: "Free" },
			{ value: "pro", label: "Pro" },
		]}
	/>
	<Checkbox bind:checked={agree} name={names ? "agree" : undefined} label="Agree" />
	<Switch bind:checked={alerts} name={names ? "alerts" : undefined} label="Alerts" />
	<Select
		bind:value={plan}
		name={names ? "plan" : undefined}
		label="Plan"
		options={[
			{ value: "a", label: "Alpha" },
			{ value: "b", label: "Beta" },
		]}
	/>
</form>
