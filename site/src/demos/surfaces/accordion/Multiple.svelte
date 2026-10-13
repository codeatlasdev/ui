<script lang="ts">
  import { Accordion, AccordionItem } from '@codeatlasdev/ui';
</script>

<div class="wrap">
  <Accordion type="multiple">
    <AccordionItem value="b1" title="Svelte 5 runes">
      Runes replace reactive declarations with explicit $state(), $derived() and $effect().
    </AccordionItem>
    <AccordionItem value="b2" title="Headless primitives">
      Unstyled, accessible primitives with the WAI-ARIA patterns built in.
    </AccordionItem>
    <AccordionItem value="b3" title="CSS custom properties">
      All --ca-* tokens are set in global.css and cascade into every component without runtime
      overhead.
    </AccordionItem>
  </Accordion>
</div>

<style>
  .wrap { width: 100%; max-width: 560px; }
</style>
