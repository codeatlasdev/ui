<script lang="ts">
	import Avatar from "./Avatar.svelte";

	let { src, alt }: { src?: string; alt?: string } = $props();
</script>

<Avatar {src} {alt} size="lg">
	{#snippet fallback()}<svg data-testid="fallback-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7" fill="currentColor" /></svg>{/snippet}
</Avatar>
