<script lang="ts">
	import TextField from "../TextField/TextField.svelte";
	import PasswordStrength from "./PasswordStrength.svelte";

	let value = $state("");
</script>

<TextField label="Password" type="password" bind:value />
<PasswordStrength {value} />
