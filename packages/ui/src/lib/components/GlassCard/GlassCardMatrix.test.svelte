<script lang="ts">
	import { createRawSnippet } from "svelte";
	import GlassCard from "./GlassCard.svelte";

	const thicknesses = ["ultra-thin", "thin", "regular", "thick", "chrome"] as const;
	const body = createRawSnippet(() => ({ render: () => `<span>Card content</span>` }));
	const actions = createRawSnippet(() => ({
		render: () => `<span style="font-size:12px">Action</span>`,
	}));
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(3,240px);gap:16px;padding:24px;width:max-content"
>
	{#each thicknesses as thickness (thickness)}
		<GlassCard {thickness} children={body} />
	{/each}
	<GlassCard tinted children={body} />
	<GlassCard glowing children={body} />
	<GlassCard tinted glowing children={body} />
	<GlassCard title="With title" headerActions={actions} children={body} />
	<GlassCard padding={4} children={body} />
	<GlassCard padding="40px" children={body} />
	<GlassCard flush>
		{#snippet children()}
			<div style="background:#888;color:#fff;padding:8px">Flush</div>
		{/snippet}
	</GlassCard>
	<GlassCard href="#target" children={body} />
</div>
