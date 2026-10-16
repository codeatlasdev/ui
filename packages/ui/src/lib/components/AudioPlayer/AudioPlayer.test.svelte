<script lang="ts">
	import AudioPlayer from "./AudioPlayer.svelte";

	interface Props {
		a: string;
		b: string;
	}
	let { a, b }: Props = $props();
</script>

<AudioPlayer src={a} duration={1} label="First" />
<AudioPlayer src={b} duration={1} label="Second" />
