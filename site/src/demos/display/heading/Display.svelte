<script lang="ts">
	import { Heading } from "@codeatlasdev/ui";
</script>

<div class="stack">
	<Heading level={1} size="display">Display headline</Heading>
	<Heading level={2} size="display-3">Display 3, fluid</Heading>
	<Heading level={2} size="h4">An h2 that looks like an h4</Heading>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--ca-space-3);
		width: 100%;
	}
</style>
