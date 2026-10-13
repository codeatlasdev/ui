<script lang="ts">
	import { Search } from "@lucide/svelte";
	import TextField from "./TextField.svelte";
</script>

{#snippet lead()}<Search size={16} />{/snippet}
{#snippet trail()}<span>kg</span>{/snippet}

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<TextField label="Empty" placeholder="Type here" />
	<TextField label="Filled" value="Maria da Silva" />
	<TextField label="Small" size="sm" value="Maria da Silva" />
	<TextField label="Description" description="Helper text" placeholder="Type here" />
	<TextField label="Error" error="Invalid field" value="abc" />
	<TextField label="Required" required placeholder="Type here" />
	<TextField label="Disabled" disabled value="Not editable" />
	<TextField label="Read only" readonly value="Read only" />
	<TextField label="Leading" leading={lead} placeholder="Search" />
	<TextField label="Trailing" trailing={trail} value="72" />
	<TextField label="Password" type="password" value="secret123" />
	<TextField
		label="Long text"
		value="An extremely long value that has to be truncated or scroll inside the text field"
	/>
</div>
