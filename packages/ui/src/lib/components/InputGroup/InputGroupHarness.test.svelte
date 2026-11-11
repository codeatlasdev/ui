<script lang="ts">
	import Button from "../Button/Button.svelte";
	import TextField from "../TextField/TextField.svelte";
	import InputGroup from "./InputGroup.svelte";
</script>

<InputGroup aria-label="Invite">
	<TextField label="Email" type="email" />
	<Button variant="filled">Send invite</Button>
</InputGroup>
