<script lang="ts">
	import Field from "./Field.svelte";
	import Fieldset from "./Fieldset.svelte";

	let { error, disabled = false }: { error?: string; disabled?: boolean } = $props();
</script>

<Field label="Plan code" description="Six letters." {error} required>
	{#snippet children(props)}<input {...props} class="custom" />{/snippet}
</Field>
<Fieldset legend="Contact" {disabled}>
	<label><input type="checkbox" /> Email me</label>
</Fieldset>
