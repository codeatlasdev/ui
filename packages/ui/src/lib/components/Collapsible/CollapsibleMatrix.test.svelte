<script lang="ts">
	import Collapsible from "./Collapsible.svelte";
</script>

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:480px">
	<Collapsible title="Closed">Hidden content</Collapsible>
	<Collapsible title="Open" open>
		Visible content with some text to check the inner padding of the body.
	</Collapsible>
	<Collapsible title="Disabled" disabled>Hidden content</Collapsible>
	<Collapsible title="A very long title to test line wrapping inside the collapsible trigger" open>
		Short body
	</Collapsible>
</div>
