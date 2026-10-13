<script lang="ts">
	import { Bell, Settings, Shield, Trash2 } from "@lucide/svelte";
	import Button from "../Button/Button.svelte";
	import TextField from "../TextField/TextField.svelte";
	import FormSection from "../templates/FormSection.svelte";
	import AppSettings from "./AppSettings.svelte";

	const tabs = [
		{ value: "general", label: "General", icon: Settings },
		{ value: "notifications", label: "Notifications", icon: Bell, badge: 2 },
		{ value: "security", label: "Security", icon: Shield },
		{ value: "danger", label: "Danger zone", icon: Trash2, danger: true },
	];
</script>

<div
	data-testid="matrix"
	style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden"
>
	<AppSettings title="Settings" description="Manage the workspace." {tabs} defaultTab="general">
		{#snippet actions()}
			<Button>Save</Button>
		{/snippet}
		{#snippet children()}
			<FormSection title="Workspace" description="Name and identifier.">
				<TextField label="Name" value="CodeAtlas" />
				<TextField label="Slug" value="codeatlas" />
			</FormSection>
		{/snippet}
	</AppSettings>
</div>
