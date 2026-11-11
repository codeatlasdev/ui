<script lang="ts">
	import MessageBubble from "../MessageBubble/MessageBubble.svelte";
	import AudioPlayer from "./AudioPlayer.svelte";

	interface Props {
		src: string;
		direction?: "in" | "out";
		tone?: "brand" | "inherit";
		variant?: "default" | "voice";
	}
	let { src, direction = "out", tone = "inherit", variant = "default" }: Props = $props();
</script>

<MessageBubble {direction} time="10:42">
	<AudioPlayer {src} duration={20} {tone} {variant} peaks={[0.2, 0.8, 0.5, 0.9, 0.3, 0.6, 0.4, 0.7]} />
</MessageBubble>
