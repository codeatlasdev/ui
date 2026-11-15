<script lang="ts">
	import ClampedText from "./ClampedText.svelte";

	interface Props {
		text: string;
		lines?: number;
		/** Host width in px: the line count of a wrapping text depends on it. */
		width?: number;
		expanded?: boolean;
		moreLabel?: string;
		lessLabel?: string;
	}

	let {
		text,
		lines,
		width = 320,
		expanded = $bindable(false),
		moreLabel,
		lessLabel,
	}: Props = $props();
</script>

<!-- Fixed width, font size and line height: `\n` is a line break (pre-line), so "9 lines" is 9 lines. -->
<div class="host" data-testid="host" style="--host-w: {width}px">
	<ClampedText {lines} bind:expanded {moreLabel} {lessLabel} class="post" data-testid="post"
		>{text}</ClampedText
	>
</div>

<style>
	.host {
		inline-size: var(--host-w);
		font-size: 16px;
		line-height: 24px;
		white-space: pre-line;
	}
</style>
