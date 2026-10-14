<script lang="ts">
	// Rendered inside /landing-embed/mobile/ so every media query, `position: fixed`, safe-area rule
	// and portal behaves exactly as on a phone. Real components: MobileHeader, BottomNav, Sheet,
	// MobilePane, StickyActions, TextField, Switch, Button, Chip.
	import {
		BottomNav,
		Button,
		Chip,
		GlassCard,
		MobileHeader,
		MobilePane,
		Sheet,
		StickyActions,
		Switch,
		TextField,
		type NavModule,
	} from "@codeatlasdev/ui";
	import { Bell, CalendarDays, ChevronRight, Home, Inbox, Settings } from "@lucide/svelte";

	const modules: NavModule[] = [
		{ id: "home", label: "Home", icon: Home, basePath: "/", items: [] },
		{ id: "inbox", label: "Inbox", icon: Inbox, basePath: "/inbox", items: [] },
		{ id: "plan", label: "Plan", icon: CalendarDays, basePath: "/plan", items: [] },
		{ id: "settings", label: "Settings", icon: Settings, basePath: "/settings", items: [] },
	];

	let active = $state(0);
	let sheet = $state(false);
	let pane = $state(false);
	let dirty = $state(false);
	let name = $state("Maya Okafor");

	const threads = [
		{ id: "a", title: "Release checklist", meta: "6 new" },
		{ id: "b", title: "Design review", meta: "2 new" },
		{ id: "c", title: "Billing questions", meta: "Yesterday" },
	];
	let current = $state(threads[0]);
</script>

<div class="app">
	<MobileHeader title={modules[active].label}>
		{#snippet trailing()}
			<Button variant="ghost" size="sm" aria-label="Notifications" onclick={() => (sheet = true)}>
				<Bell size={18} aria-hidden="true" />
			</Button>
		{/snippet}
	</MobileHeader>

	<main id="main" tabindex="-1" class="app__main">
		{#if active === 0 || active === 1}
			<ul class="app__list">
				{#each threads as t}
					<li>
						<button
							type="button"
							class="app__row"
							onclick={() => {
								current = t;
								pane = true;
							}}
						>
							<span class="app__title">{t.title}</span>
							<span class="app__meta">{t.meta}</span>
							<ChevronRight size={16} aria-hidden="true" />
						</button>
					</li>
				{/each}
			</ul>
		{:else if active === 2}
			<GlassCard title="This week">
				<div class="app__chips">
					<Chip label="Mon" size="sm" selected />
					<Chip label="Tue" size="sm" />
					<Chip label="Wed" size="sm" />
				</div>
			</GlassCard>
		{:else}
			<GlassCard title="Profile">
				<TextField
					label="Display name"
					bind:value={name}
					oninput={() => (dirty = true)}
				/>
				<div class="app__switch">
					<Switch label="Push notifications" onchange={() => (dirty = true)} />
				</div>
			</GlassCard>
			<GlassCard title="Workspace">
				<p class="app__sheet">Edit the name: the save bar pins above the tab bar and follows the keyboard.</p>
			</GlassCard>
			<div class="app__spacer" aria-hidden="true"></div>
		{/if}
	</main>

	<StickyActions show={dirty && active === 3} align="stretch">
		<Button variant="ghost" onclick={() => (dirty = false)}>Discard</Button>
		<Button onclick={() => (dirty = false)}>Save</Button>
	</StickyActions>

	<BottomNav {modules} activeIndex={active} onSelect={(i) => (active = i)} />

	<Sheet bind:open={sheet} title="Notifications" description="Drag the handle down to dismiss.">
		<p class="app__sheet">Release checklist has 6 new comments.</p>
		{#snippet footer()}
			<Button fullWidth onclick={() => (sheet = false)}>Mark all read</Button>
		{/snippet}
	</Sheet>

	<MobilePane bind:open={pane} title={current.title}>
		<div class="app__pane">
			<p>Full screen above the shell, with its own header, back button, safe areas and keyboard handling.</p>
		</div>
	</MobilePane>
</div>

<style>
	.app {
		min-block-size: var(--ca-vh);
		background: var(--ca-surface-base);
		color: var(--ca-text-primary);
		padding-block-end: calc(var(--ca-bottom-nav-h, 56px) + var(--ca-safe-bottom));
	}
	.app__main {
		padding: var(--ca-space-4);
		display: grid;
		gap: var(--ca-space-3);
	}
	.app__list {
		list-style: none;
		display: grid;
		gap: var(--ca-space-2);
	}
	.app__row {
		inline-size: 100%;
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: var(--ca-space-3);
		align-items: center;
		min-block-size: 56px;
		padding: 0 var(--ca-space-4);
		border: 0;
		border-radius: var(--ca-radius-lg);
		background: var(--ca-surface-raised);
		color: var(--ca-text-primary);
		box-shadow: 0 0 0 1px var(--ca-outline-subtle);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.app__row:active {
		scale: 0.98;
	}
	.app__row:focus-visible {
		outline: 2px solid var(--ca-focus-ring);
		outline-offset: 2px;
	}
	.app__meta {
		color: var(--ca-text-secondary);
		font-size: var(--ca-font-size-caption);
	}
	.app__chips {
		display: flex;
		gap: var(--ca-space-2);
	}
	.app__switch {
		margin-top: var(--ca-space-4);
	}
	.app__spacer {
		block-size: 40vh;
	}
	.app__sheet,
	.app__pane {
		padding: var(--ca-space-4);
		color: var(--ca-text-secondary);
		font-size: var(--ca-font-size-body2);
	}
</style>
