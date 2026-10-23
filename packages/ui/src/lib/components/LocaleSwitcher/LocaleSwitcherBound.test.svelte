<script lang="ts">
	import LocaleSwitcher from "./LocaleSwitcher.svelte";

	interface Props {
		options: { value: string; label: string; short?: string; lang?: string }[];
		onselect?: (value: string) => void | Promise<void>;
		onerror?: (error: unknown) => void;
	}
	let { options, onselect, onerror }: Props = $props();
	let value = $state("pt-BR");
</script>

<LocaleSwitcher {options} bind:value {onselect} {onerror} />
<output data-testid="value">{value}</output>
