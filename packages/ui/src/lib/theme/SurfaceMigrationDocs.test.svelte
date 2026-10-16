<script lang="ts">
	// DocsShell header and mobile pager bar, for surface-migration.svelte.test.ts.
	import DocsShell from "../components/Docs/DocsShell.svelte";
	import StickyActions from "../components/StickyActions/StickyActions.svelte";
</script>

<div data-testid="harness" style="height:640px;width:100%;position:relative">
	<DocsShell
		sections={[{ id: "guide", label: "Guide", href: "/guide" }]}
		active="guide"
		groups={[{ label: "Start", items: [{ href: "/guide/intro", title: "Intro" }] }]}
		pathname="/guide/intro"
		headings={[]}
		searchIndex={[]}
		onnavigate={() => {}}
		pager={{ prev: { href: "/guide/a", title: "Before" }, next: { href: "/guide/b", title: "After" } }}
	>
		{#snippet brand()}<strong>Acme</strong>{/snippet}
		<article>
			<p>Content</p>
			<StickyActions>{#snippet children()}<button type="button">Save</button>{/snippet}</StickyActions>
		</article>
	</DocsShell>
</div>
