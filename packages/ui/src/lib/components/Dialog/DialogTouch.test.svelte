<script lang="ts">
	import Dialog from "./Dialog.svelte";

	interface Props {
		inline?: boolean;
	}
	let { inline = false }: Props = $props();
	let open = $state(true);
</script>

<div style="position: relative; min-height: 320px">
	<Dialog bind:open {inline} title="Invite a teammate" description="They get an email.">
		<p>Body</p>
	</Dialog>
</div>
