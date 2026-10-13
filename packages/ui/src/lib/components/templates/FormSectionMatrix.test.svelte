<script lang="ts">
	import FormSection from "./FormSection.svelte";
</script>

<div data-testid="matrix" style="display:grid;gap:32px;padding:16px;width:640px">
	<FormSection title="Account" description="Basic user information.">
		{#snippet children()}
			<div>Name</div><div>Email</div><div>Phone</div><div>Role</div>
		{/snippet}
	</FormSection>
	<FormSection label="Notifications" description="Choose how to be notified." layout="list">
		{#snippet children()}
			<div style="padding:12px 0">Email</div>
			<div style="padding:12px 0">Push</div>
		{/snippet}
	</FormSection>
	<FormSection title="Profile" layout="stack">
		{#snippet children()}
			<div style="height:48px;border:1px solid #888;border-radius:8px">Avatar</div>
			<div style="height:48px;border:1px solid #888;border-radius:8px">Bio</div>
		{/snippet}
	</FormSection>
	<FormSection>
		{#snippet children()}<div>No header</div><div>Loose fields</div>{/snippet}
	</FormSection>
</div>
