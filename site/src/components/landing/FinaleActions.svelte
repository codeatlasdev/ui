<script lang="ts">
	// Rendered at build time only (no client directive): plain links styled by the package Button.
	import { Button } from "@codeatlasdev/ui";
	import { ArrowUpRight, BookOpen, Package } from "@lucide/svelte";

	interface Props {
		repo: string;
		npm: string;
	}
	let { repo, npm }: Props = $props();
</script>

<Button size="lg" href="/docs/">
	{#snippet leading()}<BookOpen size={18} aria-hidden="true" />{/snippet}
	Read the docs
</Button>
<Button size="lg" variant="outlined" href={repo}>
	See it on GitHub
	{#snippet trailing()}<ArrowUpRight size={18} aria-hidden="true" />{/snippet}
</Button>
<Button size="lg" variant="ghost" href={npm}>
	{#snippet leading()}<Package size={18} aria-hidden="true" />{/snippet}
	npm
</Button>
