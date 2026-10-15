<script lang="ts">
  import { Collapsible, Stack } from '@codeatlasdev/ui';
</script>

<Stack gap="2" class="stack">
  <Collapsible title="What is a glass surface?">
    <p>A glass surface uses backdrop-filter blur and a translucent tint to create a layered depth effect that reacts to the content behind it.</p>
  </Collapsible>
  <Collapsible title="How do presets work?">
    <p>Presets remap the brand hue token. Switching preset updates every component that reads from <code>--ca-brand-*</code> without any JS.</p>
  </Collapsible>
  <Collapsible title="Is dark mode automatic?">
    <p>Yes. The <code>colorScheme</code> store writes a <code>.dark</code> class to the root element, which flips all dark-mode tokens.</p>
  </Collapsible>
</Stack>

<style>
  :global(.stack) { width: 100%; max-width: 560px; }
  p { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); line-height: 1.6; }
</style>
