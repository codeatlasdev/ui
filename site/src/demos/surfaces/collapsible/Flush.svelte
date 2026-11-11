<script lang="ts">
  import { Collapsible } from '@codeatlasdev/ui';
</script>

<aside class="panel">
  <Collapsible title="Contact" variant="flush" open>
    <p>Phone and e-mail sit on the panel's own gutter.</p>
  </Collapsible>
  <Collapsible title="Deal" variant="flush" divided open>
    <p>divided draws the hairline between sections.</p>
  </Collapsible>
</aside>

<style>
  .panel { width: 100%; max-width: 360px; padding: 0 var(--ca-space-4); box-sizing: border-box; }
  p { margin: 0; padding-bottom: var(--ca-space-3); font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); line-height: 1.6; }
</style>
