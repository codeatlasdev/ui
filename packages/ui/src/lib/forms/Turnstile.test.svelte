<script lang="ts">
	import Turnstile, { type TurnstileHandle } from "./Turnstile.svelte";

	interface Props {
		siteKey?: string;
		action?: string;
		theme?: "auto" | "light" | "dark";
		language?: string;
		verified?: string[];
		errors?: string[];
		expired?: { n: number };
	}
	let { siteKey, action, theme, language, verified = [], errors = [], expired }: Props = $props();
	let handle = $state<TurnstileHandle>();
	let token = $state<string>();
</script>

<Turnstile
	{siteKey}
	{action}
	{theme}
	{language}
	bind:handle
	bind:token
	onverify={(t) => verified.push(t)}
	onerror={(c) => errors.push(c)}
	onexpire={() => expired && expired.n++}
/>
<button type="button" onclick={() => handle?.reset()}>reset</button>
<output data-testid="token">{handle?.getToken() ?? "none"}</output>
<output data-testid="bound">{token ?? "none"}</output>
