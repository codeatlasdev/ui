<script lang="ts">
	import GlassAppBar from "./GlassAppBar.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;background:repeating-linear-gradient(45deg,#e11d48 0 24px,#2563eb 24px 48px)"
>
	<GlassAppBar>
		{#snippet children()}<strong>Content only</strong>{/snippet}
	</GlassAppBar>
	<GlassAppBar>
		{#snippet leading()}<span>◀ Back</span>{/snippet}
		{#snippet children()}<strong>Title</strong>{/snippet}
		{#snippet trailing()}<span>Action</span>{/snippet}
	</GlassAppBar>
	<GlassAppBar>
		{#snippet leading()}<span>Menu</span>{/snippet}
		{#snippet children()}<strong>No trailing</strong>{/snippet}
	</GlassAppBar>
	<GlassAppBar>
		{#snippet children()}<strong>No leading</strong>{/snippet}
		{#snippet trailing()}<span>Profile</span>{/snippet}
	</GlassAppBar>
</div>
