<script lang="ts">
  import TextArea from './TextArea.svelte';

  // #1316: the caller points the field at a help paragraph elsewhere on the page.
  let props: Record<string, unknown> = $props();
</script>

<p id="help">Shown on your profile</p>
<TextArea id="bio" label="Bio" aria-describedby="help" {...props} />
