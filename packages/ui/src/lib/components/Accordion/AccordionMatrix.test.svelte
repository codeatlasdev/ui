<script lang="ts">
	import Accordion from "./Accordion.svelte";
	import AccordionItem from "./AccordionItem.svelte";
</script>

<div data-testid="matrix" style="display:grid;gap:24px;padding:16px;width:480px">
	<Accordion type="single" value="one">
		<AccordionItem value="one" title="First">Content one</AccordionItem>
		<AccordionItem value="two" title="Second">Content two</AccordionItem>
		<AccordionItem value="three" title="Third">Content three</AccordionItem>
	</Accordion>
	<Accordion type="multiple" value={["a", "c"]}>
		<AccordionItem value="a" title="Item A">Content A</AccordionItem>
		<AccordionItem value="b" title="Item B">Content B</AccordionItem>
		<AccordionItem value="c" title="Item C with a fairly long title to test wrapping">
			Content C
		</AccordionItem>
	</Accordion>
</div>
