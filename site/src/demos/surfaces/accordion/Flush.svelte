<script lang="ts">
  import { Accordion, AccordionItem } from '@codeatlasdev/ui';
</script>

<aside class="panel">
  <Accordion variant="flush" divided type="multiple" value={['notes']}>
    <AccordionItem value="notes" title="Notes"><p>Items share the panel gutter.</p></AccordionItem>
    <AccordionItem value="files" title="Files"><p>Attachments.</p></AccordionItem>
    <AccordionItem value="history" title="History"><p>Activity log.</p></AccordionItem>
  </Accordion>
</aside>

<style>
  .panel { width: 100%; max-width: 360px; padding: 0 var(--ca-space-4); box-sizing: border-box; }
  p { margin: 0; }
</style>
