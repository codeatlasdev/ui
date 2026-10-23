<script lang="ts">
  import { Badge } from '@codeatlasdev/ui';
</script>

<ul class="rows">
  <li><span class="title">Call back Marina Costa</span><Badge tone="danger" subtle dot size="md">Overdue</Badge></li>
  <li><span class="title">Send contract to Atlas Logistics</span><Badge tone="warning" subtle dot size="md">Due today</Badge></li>
  <li><span class="title">Review quote #4821</span><Badge tone="success" subtle dot size="md">Done</Badge></li>
  <li><span class="title">Intro email, Orion Tech</span><Badge tone="neutral" subtle size="md">Draft</Badge></li>
</ul>

<style>
  .rows { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ca-space-2); }
  li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-2); }
  .title { color: var(--ca-text-primary); }
</style>
