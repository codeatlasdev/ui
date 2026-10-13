<script lang="ts">
	import TextArea from "./TextArea.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<TextArea label="Empty" placeholder="Write something" rows={3} />
	<TextArea label="Filled" rows={3} value={"First line\nSecond line\nThird line"} />
	<TextArea label="Description" description="Helper text" rows={2} placeholder="Write something" />
	<TextArea label="Error" error="Invalid field" rows={2} value="abc" />
	<TextArea label="Required" required rows={2} placeholder="Write something" />
	<TextArea label="Disabled" disabled rows={2} value="Not editable" />
	<TextArea label="Read only" readonly rows={2} value="Read only" />
	<TextArea label="No resize" resize="none" rows={2} value="Resize none" />
	<TextArea label="Resize both" resize="both" rows={2} value="Resize both" />
	<TextArea
		label="Long text"
		rows={3}
		value="A long piece of text that has to wrap across several lines inside the text area to check wrapping behavior and the component's inner spacing."
	/>
</div>
