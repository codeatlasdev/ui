<script lang="ts">
  import FileUpload from './FileUpload.svelte';

  let { ...rest }: { [key: string]: unknown } = $props();
  let upload = $state<ReturnType<typeof FileUpload> | null>(null);
  let ref = $state<HTMLInputElement | null>(null);
  let files = $state<File[]>([]);
</script>

<button type="button" onclick={() => upload?.open()}>Add files</button>
<button type="button" onclick={() => (files = [])}>Clear</button>
<FileUpload bind:this={upload} bind:ref bind:files {...rest} />
<output data-testid="ref-tag">{ref?.tagName ?? 'none'}</output>
<output data-testid="count">{files.length}</output>
