<script lang="ts">
  import Accordion from './Accordion.svelte';
  import AccordionItem from './AccordionItem.svelte';

  let {
    type = 'single',
    value = $bindable(),
    variant,
    divided,
  }: {
    type?: 'single' | 'multiple';
    value?: string | string[];
    variant?: 'boxed' | 'flush';
    divided?: boolean;
  } = $props();
</script>

<Accordion {type} bind:value {variant} {divided}>
  <AccordionItem value="one" title="First">Content one</AccordionItem>
  <AccordionItem value="two" title="Second">Content two</AccordionItem>
  <AccordionItem value="three" title="Third">Content three</AccordionItem>
</Accordion>

<output data-testid="value">{JSON.stringify(value ?? null)}</output>
