<script lang="ts">
	import Button from "../Button/Button.svelte";
	import TextField from "../TextField/TextField.svelte";
	import AuthCard from "./AuthCard.svelte";
	import AuthLayout from "./AuthLayout.svelte";
</script>

<div data-testid="matrix" style="position:relative;width:100vw;height:100vh;overflow:hidden">
	<AuthLayout logoMark="CA" logoName="CodeAtlas UI">
		{#snippet panel()}
			<blockquote style="margin:0;color:var(--panel-text-primary)">
				Build consistent interfaces in minutes.
			</blockquote>
		{/snippet}
		<AuthCard title="Welcome back" subtitle="Sign in to continue">
			<TextField label="Email" type="email" value="ana@example.com" />
			<TextField label="Password" type="password" value="secret123" />
			<Button fullWidth>Sign in</Button>
			{#snippet footer()}
				Don't have an account? <a href="/sign-up">Sign up</a>
			{/snippet}
		</AuthCard>
	</AuthLayout>
</div>
