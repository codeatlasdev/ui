<script lang="ts">
	import PinInput from "./PinInput.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:24px;padding:16px;width:max-content;grid-template-columns:repeat(2,max-content)"
>
	<PinInput label="Empty" />
	<PinInput label="Partial" value="123" />
	<PinInput label="Complete" value="123456" />
	<PinInput label="Masked" value="1234" mask />
	<PinInput label="Four digits" length={4} value="12" />
	<PinInput label="Text" type="text" length={5} value="AB1" />
	<PinInput label="Description" description="Code sent by SMS" value="12" />
	<PinInput label="Error" error="Invalid code" value="123456" />
	<PinInput label="Disabled" disabled value="123" />
</div>
