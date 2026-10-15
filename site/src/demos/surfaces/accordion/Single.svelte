<script lang="ts">
  import { Accordion, AccordionItem } from '@codeatlasdev/ui';
</script>

<div class="wrap">
  <Accordion type="single">
    <AccordionItem value="a1" title="What is Liquid Glass?">
      Liquid Glass is the opt-in look of the kit: backdrop blur, refraction and tinting on
      surfaces. The default theme is solid.
    </AccordionItem>
    <AccordionItem value="a2" title="Which browsers support backdrop-filter?">
      All modern evergreen browsers. Older environments receive a fallback without the blur effect.
    </AccordionItem>
    <AccordionItem value="a3" title="Can I nest a Surface inside a Card?">
      Yes. A Card is a Surface, so any Surface can sit inside it.
    </AccordionItem>
  </Accordion>
</div>

<style>
  .wrap { width: 100%; max-width: 560px; }
</style>
