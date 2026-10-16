<script lang="ts">
	import {
		announce,
		Button,
		Checkbox,
		CopyButton,
		StickyActions,
		TextField,
		ToggleGroup,
	} from "@codeatlasdev/ui";
	import { onMount } from "svelte";
	import GalleryPreview from "./GalleryPreview.svelte";
	import { copyText, parsePicks, safeCallback } from "./picks";

	interface Element {
		id: string;
		group: string;
		page: string;
		variant: string;
		title: string;
		summary: string;
		tags: string[];
		components: string[];
		/** Same-site path + hash of the live docs section. */
		demo: string;
	}
	interface Props {
		elements: Element[];
		groups: string[];
	}
	let { elements, groups }: Props = $props();

	let query = $state("");
	let group = $state("all");
	let picks = $state<string[]>([]);
	let callback = $state<string | null>(null);

	const known = $derived(new Set(elements.map((e) => e.id)));
	const byId = $derived(new Map(elements.map((e) => [e.id, e])));
	const groupItems = $derived([
		{ value: "all", label: "All" },
		...groups.map((g) => ({ value: g, label: g })),
	]);

	const haystacks = $derived(
		new Map(
			elements.map((e) => [
				e.id,
				`${e.id} ${e.title} ${e.summary} ${e.tags.join(" ")} ${e.components.join(" ")}`.toLowerCase(),
			])
		)
	);
	const visible = $derived.by(() => {
		const words = query.toLowerCase().split(/\s+/).filter(Boolean);
		return elements.filter(
			(e) =>
				(group === "all" || e.group === group) &&
				words.every((w) => haystacks.get(e.id)?.includes(w))
		);
	});
	const sorted = $derived([...picks].sort());
	const picked = $derived(new Set(picks));
	const text = $derived(
		copyText(
			sorted.flatMap((id) => {
				const e = byId.get(id);
				return e ? [{ id, title: e.title }] : [];
			})
		)
	);

	function toggle(id: string, on: boolean) {
		picks = on ? [...picks.filter((p) => p !== id), id] : picks.filter((p) => p !== id);
		announce(`${picks.length} picked`);
		const url = new URL(location.href);
		if (picks.length) url.searchParams.set("pick", [...picks].sort().join(","));
		else url.searchParams.delete("pick");
		history.replaceState(history.state, "", url);
	}

	function sendToAi() {
		if (callback) location.href = `${callback}${callback.includes("?") ? "&" : "?"}ids=${sorted.join(",")}`;
	}

	onMount(() => {
		const params = new URLSearchParams(location.search);
		picks = parsePicks(params.get("pick"), known);
		callback = safeCallback(params.get("cb"));
		const hash = location.hash.match(/^#(\d{3})$/)?.[1];
		if (hash) document.getElementById(hash)?.scrollIntoView({ block: "center" });
	});
</script>

<div class="gallery">
	<header class="gallery__head">
		<p class="sk-eyebrow">Sketchbook</p>
		<h1>{elements.length} numbered pages</h1>
		<p class="gallery__lead">
			Every demo in the docs is a page with a number. Filter, tick the ones you want, then copy the list or hand it to your AI.
		</p>
	</header>

	<aside class="gallery__howto sk-page" aria-label="How it works">
		<p class="sk-caption">1. Pick pages.</p>
		<p class="sk-caption">2. Copy the list, or open <code>?pick=</code> links.</p>
		<p class="sk-caption">3. Your AI calls <code>get_demo</code> for each number: <code>get_demo({'{'} ids: ["#012"] {'}'})</code></p>
	</aside>

	<div class="gallery__filters">
		<TextField label="Filter demos" placeholder="Search title, tag or component" bind:value={query} />
		<ToggleGroup
			type="single"
			aria-label="Group"
			items={groupItems}
			value={group}
			onchange={(v) => (group = (v as string) || "all")}
		/>
	</div>

	<p class="gallery__count">{visible.length} of {elements.length} shown</p>

	<ul class="gallery__grid">
		{#each visible as e (e.id)}
			<li class="gallery-card-wrap">
				<article class="gallery-card sk-page" id={e.id} class:gallery-card--picked={picked.has(e.id)}>
					<span class="sk-page__num">#{e.id}</span>
					<header class="gallery-card__head">
						<span class="gallery-card__group">{e.group}</span>
					</header>
					<h2 class="gallery-card__title">{e.title}</h2>
					<p class="gallery-card__summary">{e.summary}</p>
					<div class="gallery-card__preview">
						<GalleryPreview path={`${e.group}/${e.page}/${e.variant}`} title={e.title} />
					</div>
					<footer class="gallery-card__foot">
						<Checkbox
							label={`Pick #${e.id}`}
							checked={picked.has(e.id)}
							onchange={(on) => toggle(e.id, on)}
						/>
						<a href={e.demo}>Docs: {e.page}</a>
					</footer>
				</article>
			</li>
		{/each}
	</ul>

	{#if visible.length === 0}
		<p class="gallery__empty">No demo matches. Clear the filter to see all {elements.length}.</p>
	{/if}

	<StickyActions show={picks.length > 0} align="end">
		<span class="gallery__picks">{picks.length} picked</span>
		<span data-testid="gallery-picks" data-value={text}>
			<CopyButton value={text} label="Copy picks" variant="outlined" toast="Picks copied" />
		</span>
		{#if callback}
			<Button onclick={sendToAi}>Send to AI</Button>
		{/if}
	</StickyActions>
</div>

<style>
	.gallery {
		display: grid;
		gap: var(--ca-space-4);
	}
	.gallery__head h1 {
		margin: var(--ca-space-1) 0;
	}
	.gallery__lead {
		margin: 0;
		color: var(--ca-text-body);
	}
	.gallery__howto {
		display: grid;
		gap: var(--ca-space-1);
		padding-block: var(--ca-space-4);
		padding-inline-end: var(--ca-space-4);
	}
	.gallery__howto code {
		font-family: var(--ca-font-mono);
		font-style: normal;
		color: var(--ca-text-primary);
	}
	.gallery__filters {
		display: grid;
		gap: var(--ca-space-3);
	}
	.gallery__filters :global(.ca-toggle-group) {
		flex-wrap: wrap;
		justify-self: start;
	}
	.gallery__count {
		margin: 0;
		font-size: var(--ca-font-size-body2);
		color: var(--ca-text-secondary);
	}
	.gallery__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
		gap: var(--ca-space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.gallery-card-wrap {
		display: grid;
		min-width: 0;
	}
	.gallery-card {
		display: grid;
		grid-template-rows: auto auto auto 1fr auto;
		gap: var(--ca-space-2);
		min-width: 0;
		padding-block: var(--ca-space-5) var(--ca-space-4);
		padding-inline-end: var(--ca-space-4);
		scroll-margin-top: calc(var(--ca-space-16) + var(--ca-space-4));
	}
	.gallery-card--picked {
		outline: 3px solid var(--ca-brand-main);
		outline-offset: 2px;
	}
	.gallery-card__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ca-space-2);
	}
	.gallery-card__group {
		padding: 0 var(--ca-space-2);
		border-radius: var(--ca-radius-pill);
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-secondary);
		box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
	}
	.gallery-card__title {
		margin: 0;
		font-size: var(--ca-font-size-h6);
	}
	.gallery-card__summary {
		margin: 0;
		font-size: var(--ca-font-size-body2);
		color: var(--ca-text-secondary);
	}
	.gallery-card__preview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ca-space-3);
		/* Fixed box: lazily mounted demos must not shift the grid (CLS 0 while scrolling and tapping). */
		height: 14rem;
		contain: layout paint;
		min-width: 0;
		padding: var(--ca-space-4);
		border-radius: var(--ca-radius-md);
		box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
		overflow: hidden;
	}
	.gallery-card__foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ca-space-2);
		font-size: var(--ca-font-size-body2);
	}
	.gallery__empty {
		color: var(--ca-text-secondary);
	}
	.gallery__picks {
		margin-inline-end: auto;
		font-size: var(--ca-font-size-body2);
		color: var(--ca-text-secondary);
	}
</style>
