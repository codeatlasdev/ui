<script lang="ts">
	import { createRawSnippet } from "svelte";
	import { Inbox, SearchX } from "@lucide/svelte";
	import EmptyState from "./EmptyState.svelte";

	const actions = createRawSnippet(() => ({
		render: () =>
			`<span style="display:inline-block;padding:8px 16px;border-radius:8px;background:#888;color:#fff">Create item</span>`,
	}));
	const body = createRawSnippet(() => ({ render: () => `<span>Text via children</span>` }));
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(2,420px);gap:24px;padding:16px;width:max-content"
>
	<EmptyState title="Nothing here" />
	<EmptyState icon={Inbox} title="Empty inbox" description="You have no messages." />
	<EmptyState icon={SearchX} title="No results" {actions}>
		{#snippet children()}Try another term.{/snippet}
	</EmptyState>
	<EmptyState icon={Inbox} title="With children" {actions} children={body} />
	<EmptyState
		variant="hero"
		icon={Inbox}
		title="Start your first project"
		description="Create a project to organize your tasks and invite the team."
		{actions}
	/>
	<EmptyState variant="hero" title="Hero without icon" description="No icon or actions." />
</div>
