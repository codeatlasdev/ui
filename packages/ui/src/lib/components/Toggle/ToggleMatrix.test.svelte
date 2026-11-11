<script lang="ts">
	import { Bold, Italic } from "@lucide/svelte";
	import Toggle from "./Toggle.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:520px;grid-template-columns:repeat(3,max-content);align-items:center"
>
	<Toggle label="Bold" />
	<Toggle label="Bold" pressed />
	<Toggle label="Bold" disabled />
	<Toggle label="Italic" variant="ghost" />
	<Toggle label="Italic" variant="ghost" pressed />
	<Toggle label="Italic" variant="ghost" disabled pressed />
	<Toggle icon={Bold} aria-label="Bold" />
	<Toggle icon={Bold} aria-label="Bold" pressed size="sm" />
	<Toggle icon={Italic} label="Italic" variant="ghost" size="sm" />
</div>
