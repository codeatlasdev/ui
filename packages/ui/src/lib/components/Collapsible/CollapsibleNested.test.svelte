<script lang="ts">
  import Accordion from '../Accordion/Accordion.svelte';
  import AccordionItem from '../Accordion/AccordionItem.svelte';
  import Collapsible from './Collapsible.svelte';
</script>

<!-- A boxed section inside a flush one must keep its box (#912). -->
<Collapsible title="Outer" variant="flush" open>
  <Collapsible title="Inner" open>Inner body</Collapsible>
</Collapsible>

<Accordion type="single" value="a" variant="flush">
  <AccordionItem value="a" title="Outer item">
    <Accordion type="single" value="b">
      <AccordionItem value="b" title="Inner item">Inner body</AccordionItem>
    </Accordion>
  </AccordionItem>
</Accordion>
