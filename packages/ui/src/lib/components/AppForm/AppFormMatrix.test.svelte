<script lang="ts">
	import Button from "../Button/Button.svelte";
	import TextField from "../TextField/TextField.svelte";
	import FormSection from "../templates/FormSection.svelte";
	import AppForm from "./AppForm.svelte";
</script>

<div
	data-testid="matrix"
	style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden"
>
	<AppForm title="New user" description="Fill in the details below." backHref="/users">
		<FormSection title="Account" description="Access information.">
			<TextField label="Name" value="Ana Souza" />
			<TextField label="Email" type="email" value="ana@example.com" />
		</FormSection>
		{#snippet footer()}
			<Button variant="ghost">Cancel</Button>
			<Button>Save</Button>
		{/snippet}
	</AppForm>
</div>
