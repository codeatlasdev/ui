<script lang="ts">
	import Accordion from "../Accordion/Accordion.svelte";
	import AccordionItem from "../Accordion/AccordionItem.svelte";
	import Collapsible from "./Collapsible.svelte";
</script>

<!-- A side panel: the flush sections must sit on the panel's own gutter, not add one. -->
<aside data-testid="matrix" data-panel class="ca-flush-panel">
	<Collapsible title="Contact" variant="flush" open>Phone and e-mail</Collapsible>
	<Collapsible title="Deal" variant="flush" divided open>Value and stage</Collapsible>
	<Accordion variant="flush" divided type="multiple" value={["a"]}>
		<AccordionItem value="a" title="Notes">First note</AccordionItem>
		<AccordionItem value="b" title="Files">Attachments</AccordionItem>
	</Accordion>
</aside>

<style>
	.ca-flush-panel {
		padding: 0 var(--ca-space-4);
		width: 100%;
		box-sizing: border-box;
	}
</style>
