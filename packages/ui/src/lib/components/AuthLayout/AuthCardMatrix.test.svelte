<script lang="ts">
	import AuthCard from "./AuthCard.svelte";

	const field = "height:40px;border:1px solid #888;border-radius:8px;padding:10px;box-sizing:border-box";
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(2,400px);gap:24px;padding:24px;width:max-content;align-items:start"
>
	<AuthCard title="Welcome back" subtitle="Sign in to continue">
		{#snippet children()}
			<div style={field}>Email</div>
			<div style={field}>Password</div>
		{/snippet}
		{#snippet footer()}Don't have an account? <a href="#sign-in">Sign up</a>{/snippet}
	</AuthCard>
	<AuthCard title="Title only">
		{#snippet children()}<div style={field}>Field</div>{/snippet}
	</AuthCard>
	<AuthCard subtitle="Subtitle only">
		{#snippet children()}<div style={field}>Field</div>{/snippet}
	</AuthCard>
	<AuthCard>
		{#snippet children()}<div style={field}>No header or footer</div>{/snippet}
	</AuthCard>
</div>
