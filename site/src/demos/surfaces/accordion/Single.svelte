<script lang="ts">
  import { Accordion, AccordionItem } from '@codeatlasdev/ui';
</script>

<div class="wrap">
  <Accordion type="single">
    <AccordionItem value="a1" title="What is a surface style?">
      A surface style is one knob of the theme: solid (the default), flat, outlined, tonal, frosted,
      glass and more. Every component follows it.
    </AccordionItem>
    <AccordionItem value="a2" title="Do I need to change components to restyle the app?">
      No. Change the theme object and every component follows, in light and dark.
    </AccordionItem>
    <AccordionItem value="a3" title="Can I nest a Surface inside a Card?">
      Yes. A Card is a Surface, so any Surface can sit inside it.
    </AccordionItem>
  </Accordion>
</div>

<style>
  .wrap { width: 100%; max-width: 560px; }
</style>
