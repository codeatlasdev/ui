<script lang="ts">
	import Stepper from "./Stepper.svelte";

	const steps = [
		{ label: "Account", description: "Basic details" },
		{ label: "Address", description: "Where to deliver" },
		{ label: "Payment", description: "Payment method" },
		{ label: "Review" },
	];
</script>

<div data-testid="matrix" style="display:grid;gap:32px;padding:16px;width:960px">
	<Stepper {steps} current={0} />
	<Stepper {steps} current={2} />
	<Stepper {steps} current={3} />
	<Stepper steps={[{ label: "One" }, { label: "Two" }]} current={1} />
</div>
