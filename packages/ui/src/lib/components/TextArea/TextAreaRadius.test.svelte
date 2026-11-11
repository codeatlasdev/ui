<script lang="ts">
  import TextField from '../TextField/TextField.svelte';
  import TextArea from './TextArea.svelte';

  let { style = '' }: { style?: string } = $props();
</script>

<div {style}>
  <TextField label="Name" />
  <TextArea label="Bio" rows={3} />
</div>
