<script lang="ts">
  import Accordion from './Accordion.svelte';
  import AccordionItem from './AccordionItem.svelte';

  let {
    type = 'single',
    value = $bindable(),
  }: { type?: 'single' | 'multiple'; value?: string | string[] } = $props();
</script>

<Accordion {type} bind:value>
  <AccordionItem value="one" title="First">Content one</AccordionItem>
  <AccordionItem value="two" title="Second">Content two</AccordionItem>
  <AccordionItem value="three" title="Third">Content three</AccordionItem>
</Accordion>

<output data-testid="value">{JSON.stringify(value ?? null)}</output>
