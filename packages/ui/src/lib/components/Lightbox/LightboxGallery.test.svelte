<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Lightbox, { type LightboxItem } from "./Lightbox.svelte";

	let {
		onclose,
		ondownload,
		start = 0,
	}: {
		onclose?: () => void;
		ondownload?: (item: LightboxItem, index: number) => void;
		start?: number;
	} = $props();
	let open = $state(false);
	// svelte-ignore state_referenced_locally
	let index = $state(start);
	const gif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
	const items: LightboxItem[] = [
		{ type: "image", src: gif, alt: "Primeira foto", caption: "Praia", meta: "Maria, 10:42" },
		{ type: "video", src: "data:video/mp4;base64,", alt: "Clipe curto", poster: gif, caption: "Clipe" },
		{ type: "image", src: gif, alt: "Terceira foto" },
	];
</script>

<Button onclick={() => (open = true)}>Abrir galeria</Button>
<output data-testid="index">{index}</output>
<Lightbox bind:open bind:index {items} {onclose} {ondownload} />
