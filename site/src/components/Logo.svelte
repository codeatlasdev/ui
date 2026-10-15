<script lang="ts">
	// The mark has one source (src/brand/mark.svg); the favicon and app icons render the same file
	// with literal colors. Here the colors stay live theme tokens.
	import mark from "~/brand/mark.svg?raw";

	const svg = mark
		.replace(/<!--[\s\S]*?-->\s*/g, "")
		.replace("<svg ", '<svg class="logo" width="24" height="24" aria-hidden="true" ')
		.replaceAll("{{ink}}", "var(--ca-text-primary)")
		.replaceAll("{{spark}}", "var(--ca-brand-main)");
</script>

{@html svg}
