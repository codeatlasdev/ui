<script lang="ts">
  import { Button, PreviewStage } from '@codeatlasdev/ui';

  let width = $state<number | 'fill'>(390);
  let scheme = $state<'light' | 'dark'>('light');
</script>

<PreviewStage label="Button pair" bind:width {scheme} height={220}>
  <Button>Continue</Button>
  <Button variant="outlined">Cancel</Button>
  {#snippet toolbar()}
    <Button size="sm" variant="ghost" onclick={() => (scheme = scheme === 'light' ? 'dark' : 'light')}>
      {scheme === 'light' ? 'Dark' : 'Light'}
    </Button>
  {/snippet}
</PreviewStage>
