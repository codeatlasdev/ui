<script lang="ts">
  import Card from './Card.svelte';

  let { ...rest }: { [key: string]: unknown } = $props();
</script>

<Card {...rest}>
  <div class="inner">Padded wrapper</div>
</Card>

<style>
  .inner { padding: 1.25rem; }
</style>
