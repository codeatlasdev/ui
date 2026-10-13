<script lang="ts">
	import { Alert, Badge, Button, Chip, GlassCard, Switch, TextField } from "../index.js";
	import { defineTheme, themeCSS } from "./define.js";
	import { type DesignStyleId, designStyle } from "./styles.js";

	let { id }: { id: DesignStyleId } = $props();
	const css = $derived(themeCSS(defineTheme(designStyle(id))));
</script>

<svelte:head>
	{@html `<style data-testid="design-style-css">${css}</style>`}
</svelte:head>

<!-- High-frequency, colorful backdrop: glass/frosted/acrylic only differ over real content. -->
<div
	data-testid="matrix"
	style="display:grid;gap:var(--ca-space-4);width:560px;padding:var(--ca-space-6);background:
		radial-gradient(circle at 15% 20%, var(--ca-brand-main) 0 18%, transparent 19%),
		radial-gradient(circle at 85% 70%, var(--ca-semantic-info) 0 16%, transparent 17%),
		repeating-linear-gradient(45deg, var(--ca-outline-default) 0 2px, transparent 2px 12px),
		var(--ca-surface-base)"
>
	<GlassCard title="Settings">
		<div style="display:flex;gap:var(--ca-space-2);flex-wrap:wrap;align-items:center">
			<Button>Save</Button>
			<Button variant="outlined">Cancel</Button>
			<Badge count={3}><Button variant="ghost">Inbox</Button></Badge>
			<Chip label="Tag" />
			<Switch checked />
		</div>
	</GlassCard>
	<TextField label="Name" value="CodeAtlas" />
	<Alert severity="info" title="Heads up">Body text in the alert.</Alert>
</div>
