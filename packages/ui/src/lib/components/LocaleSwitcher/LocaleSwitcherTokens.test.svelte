<script lang="ts">
	import type { IconComponent } from "../../types.js";
	import LocaleSwitcher from "./LocaleSwitcher.svelte";

	let {
		tokens = {},
		size,
		icon,
	}: { tokens?: Record<string, string>; size?: "sm" | "md"; icon?: IconComponent } =
		$props();
	const options = [
		{ value: "pt-BR", label: "Português", short: "PT" },
		{ value: "en", label: "English" },
	];
	const vars = $derived(
		Object.entries(tokens)
			.map(([k, v]) => `${k}:${v}`)
			.join(";")
	);
</script>

<div style={vars}>
	<LocaleSwitcher {options} value="pt-BR" {size} {icon} />
</div>
