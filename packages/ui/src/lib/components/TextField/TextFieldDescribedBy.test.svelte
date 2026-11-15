<script lang="ts">
  import TextField from './TextField.svelte';

  // #1316: the caller points the field at a help paragraph elsewhere on the page.
  let props: Record<string, unknown> = $props();
</script>

<p id="help">Used on invoices</p>
<TextField id="email" label="Email" aria-describedby="help" {...props} />
