<script lang="ts">
	import ExternalLink from "./ExternalLink.svelte";
	interface Props {
		href?: string;
		showIcon?: boolean;
	}
	let { href = "https://example.com/buy", showIcon = true }: Props = $props();
</script>

<main>
	<ExternalLink {href} {showIcon}>Buy at registrar</ExternalLink>
</main>
