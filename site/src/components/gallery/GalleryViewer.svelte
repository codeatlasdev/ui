<script lang="ts">
	import {
		announce,
		Button,
		Chip,
		CopyButton,
		PreviewStage,
		reducedMotion,
		SegmentedControl,
		Select,
		Tabs,
		TabsContent,
		TabsList,
		TabsTrigger,
	} from "@codeatlasdev/ui";
	import { CodeSnippet } from "@codeatlasdev/ui/code";
	import { ArrowLeft, ArrowRight, ExternalLink, Moon, RotateCcw, Sun } from "@lucide/svelte";
	import type { Component } from "svelte";
	import { onMount } from "svelte";
	import type { IndexEntry } from "../../../../packages/ui/scripts/index-build";
	import type { GalleryItem } from "~/lib/gallery-items";
	import { type AnatomyPart, buildPrompt, type ItemRecord } from "~/lib/item-tabs";
	import { loadDemo, loadSource } from "./demo-loader";
	import { ensureDemoSession } from "./demo-session";
	import { copyText, parsePicks } from "./picks";
	import { stageUrl, type StageScheme } from "./stage-protocol";

	interface Props {
		item: GalleryItem;
		/** Ids the arrows page through, in gallery order. */
		order: string[];
		/** Known ids, for `?pick=`. */
		known: string[];
		presets: { value: string; label: string }[];
		/** Catalog record of a demo (spec, imports, motion); pages have none. */
		record?: ItemRecord;
		/** Index facets of a demo that the Prompt tab reads (keyboard, reduced motion). */
		entry?: IndexEntry;
		/** Components of a demo with the package and docs link of each. */
		anatomy?: AnatomyPart[];
		/** Related demos: id, title and subtype. */
		related?: { id: string; title: string; subtype: string }[];
	}
	let { item, order, known, presets, record, entry, anatomy = [], related = [] }: Props = $props();
	const TABS = ["preview", "code", "prompt", "anatomy"];

	const WIDTHS = [390, 768, 1280];

	let width = $state<number | "fill">("fill");
	let scheme = $state<StageScheme>("dark");
	let preset = $state("");
	let tab = $state("preview");
	let Demo = $state<Component | null>(null);
	let source = $state("");
	let failed = $state(false);
	let cycle = $state(0);
	let picked = $state(false);
	let iframeHost = $state<HTMLElement>();

	const index = $derived(order.indexOf(item.id));
	const prev = $derived(index > 0 ? order[index - 1] : undefined);
	const next = $derived(index >= 0 && index < order.length - 1 ? order[index + 1] : undefined);
	const isPage = $derived(item.kind === "page");
	const stageHeight = $derived(isPage ? 640 : 480);
	// The first theme goes in the URL (right first paint); later changes are messages, so the page never reloads.
	let src = $state<string | undefined>();
	const label = $derived(`${item.title} at ${width === "fill" ? "full width" : `${width} pixels`}`);

	const prompt = $derived(
		record
			? buildPrompt(record, entry)
			: isPage
			? `Use the "${item.title}" page from the @codeatlasdev/ui gallery (${item.docs}) as the starting point for my screen. Keep the layout, components and tokens; replace the copy and data with mine.`
			: `Use @codeatlasdev/ui demo #${item.id} "${item.title}" (${item.group}/${item.page}). Call get_demo({ ids: ["#${item.id}"] }), keep the components, props and tokens, and change only the data and copy.`
	);
	const pickText = $derived(copyText([{ id: item.id, title: item.title }]));

	// Demos mount inline: the stage is a real box of the chosen width, themed in its own island.
	$effect(() => {
		Demo = null;
		failed = false;
		source = "";
		if (isPage || !item.path) return;
		const path = item.path;
		loadDemo(path)
			?.then((m) => (Demo = m.default))
			.catch(() => (failed = true)) ?? (failed = true);
		loadSource(path)?.then((s) => (source = s.trim()));
	});

	// A page lives in an iframe: the scheme and preset follow by message, no reload.
	$effect(() => {
		const t = { type: "ca-stage:theme", scheme, preset: preset || undefined };
		iframeHost?.querySelector("iframe")?.contentWindow?.postMessage(t, location.origin);
	});

	function replay() {
		// A new key remounts the stage: a motion demo restarts, a page reloads.
		cycle++;
		announce("Replaying");
	}

	function go(id: string | undefined) {
		if (!id) return;
		const url = new URL(`/gallery/${id}/`, location.origin);
		url.search = location.search;
		location.assign(url);
	}

	function typing(t: EventTarget | null) {
		const el = t as HTMLElement | null;
		return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.getAttribute?.("role") === "separator");
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing(e.target)) return;
		// Arrows move through the set unless focus is on a control that owns them (radios, tabs, splitter).
		const own = (e.target as HTMLElement | null)?.closest?.('[role="radiogroup"],[role="radio"],[role="tablist"],[role="separator"],[role="listbox"]');
		if (own) return;
		if (e.key === "ArrowLeft") {
			e.preventDefault();
			go(prev);
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			go(next);
		}
	}

	function togglePick() {
		picked = !picked;
		const params = new URLSearchParams(location.search);
		const ids = parsePicks(params.get("pick"), new Set(known)).filter((p) => p !== item.id);
		if (picked) ids.push(item.id);
		if (ids.length) params.set("pick", ids.sort().join(","));
		else params.delete("pick");
		const qs = params.toString();
		history.replaceState(history.state, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
		announce(picked ? `Picked #${item.id}` : `Unpicked #${item.id}`);
	}

	onMount(() => {
		const params = new URLSearchParams(location.search);
		picked = parsePicks(params.get("pick"), new Set(known)).includes(item.id);
		const w = params.get("w");
		if (w === "fill" || (w && WIDTHS.includes(Number(w)))) width = w === "fill" ? "fill" : Number(w);
		const s = params.get("scheme");
		if (s === "light" || s === "dark") scheme = s;
		else scheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
		preset = params.get("preset") ?? "";
		if (item.auth) ensureDemoSession();
		if (isPage && item.route) src = stageUrl(item.route, { scheme, preset: preset || undefined });
		const t = params.get("tab");
		if (t && TABS.includes(t) && (!isPage || t === "preview" || t === "prompt")) tab = t;
	});

	// Keep the stage state in the URL so a view can be shared as is.
	$effect(() => {
		if (typeof location === "undefined") return;
		const params = new URLSearchParams(location.search);
		params.set("w", String(width));
		params.set("scheme", scheme);
		if (preset) params.set("preset", preset);
		else params.delete("preset");
		if (tab !== "preview") params.set("tab", tab);
		else params.delete("tab");
		history.replaceState(history.state, "", `${location.pathname}?${params}${location.hash}`);
	});

	const schemeItems = [
		{ value: "light", icon: Sun, "aria-label": "Light" },
		{ value: "dark", icon: Moon, "aria-label": "Dark" },
	];
</script>

<svelte:window {onkeydown} />

<div class="viewer">
	<header class="viewer__head">
		<nav class="viewer__crumbs" aria-label="Gallery">
			<a href="/gallery/">&larr; Gallery</a>
		</nav>
		<div class="viewer__title">
			<span class="viewer__num">{isPage ? "page" : `#${item.id}`}</span>
			<h1>{item.title}</h1>
			{#if item.beta}<Chip size="sm" variant="warning" label="Beta" />{/if}
		</div>
		<p class="viewer__summary">{item.summary}</p>
		<ul class="viewer__tags" aria-label="Components">
			{#each item.components as c (c)}<li>{c}</li>{/each}
		</ul>
	</header>

	<div class="viewer__bar">
		<SegmentedControl
			size="sm"
			aria-label="Color scheme"
			value={scheme}
			items={schemeItems}
			onchange={(v) => (scheme = v as StageScheme)}
		/>
		<div class="viewer__preset">
			<Select
				size="sm"
				aria-label="Preset"
				value={preset}
				options={[{ value: "", label: "Site preset" }, ...presets]}
				onchange={(v) => (preset = v)}
			/>
		</div>
		{#if item.motion || isPage}
			<Button size="sm" variant="outlined" onclick={replay}>
				{#snippet leading()}<RotateCcw size={14} aria-hidden="true" />{/snippet}
				Replay{#if reducedMotion.value}<span class="viewer__rm"> (motion reduced)</span>{/if}
			</Button>
		{/if}
		<span class="viewer__spacer"></span>
		<Button size="sm" variant="ghost" href={item.docs}>
			{#snippet trailing()}<ExternalLink size={14} aria-hidden="true" />{/snippet}
			Docs
		</Button>
		<Button size="sm" variant={picked ? "filled" : "outlined"} aria-pressed={picked} onclick={togglePick}>
			{picked ? `Picked #${item.id}` : "Pick"}
		</Button>
		<span data-testid="viewer-prompt" data-value={prompt}>
			<CopyButton value={prompt} label="Copy prompt" variant="outlined" size="sm" toast="Prompt copied" />
		</span>
		{#if picked}
			<span data-testid="viewer-pick" data-value={pickText}></span>
		{/if}
	</div>

	<Tabs bind:value={tab} variant="line">
		<TabsList aria-label="View">
			<TabsTrigger value="preview">Preview</TabsTrigger>
			{#if !isPage}<TabsTrigger value="code">Code</TabsTrigger>{/if}
			<TabsTrigger value="prompt">Prompt</TabsTrigger>
			{#if !isPage}<TabsTrigger value="anatomy">Anatomy</TabsTrigger>{/if}
		</TabsList>
		<TabsContent value="preview">
			<div bind:this={iframeHost}>
				{#key `${cycle}:${item.id}`}
					{#if isPage}
						{#if src}
							<PreviewStage {label} bind:width height={stageHeight} {src} widths={WIDTHS} />
						{:else}
							<div class="viewer__reserve" style="--reserve-h:{stageHeight}px"></div>
						{/if}
					{:else}
						<PreviewStage {label} bind:width {scheme} preset={preset || undefined} height={stageHeight} widths={WIDTHS}>
							{#if Demo}
								<Demo />
							{:else if failed}
								<p class="viewer__note">This demo has no preview. See the docs link.</p>
							{/if}
						</PreviewStage>
					{/if}
				{/key}
			</div>
		</TabsContent>
		<TabsContent value="prompt">
			<div class="viewer__panel">
				<p class="viewer__note">
					Hand this to your AI. It names the exact library parts, timings and accessibility promises of this {isPage ? "page" : "demo"}.
				</p>
				<pre class="viewer__prompt" data-testid="viewer-prompt-text">{prompt}</pre>
				<CopyButton value={prompt} label="Copy prompt" variant="outlined" size="sm" toast="Prompt copied" />
			</div>
		</TabsContent>
		{#if !isPage}
			<TabsContent value="anatomy">
				<div class="viewer__panel">
					<h2 class="viewer__h">Library parts</h2>
					<ul class="viewer__parts">
						{#each anatomy as p (p.name)}
							<li>
								{#if p.href}<a href={p.href}>{p.name}</a>{:else}<span>{p.name}</span>{/if}
								<code>{p.from}</code>
							</li>
						{/each}
					</ul>
					{#if record?.spec.length}
						<h2 class="viewer__h">How it is built</h2>
						<ul class="viewer__spec">
							{#each record.spec as line (line)}<li>{line}</li>{/each}
						</ul>
					{/if}
					{#if related.length}
						<h2 class="viewer__h">Related</h2>
						<ul class="viewer__related">
							{#each related as r (r.id)}
								<li><a href={`/gallery/${r.id}/`}>#{r.id} {r.title}</a> <span class="sk-caption">{r.subtype}</span></li>
							{/each}
						</ul>
					{/if}
				</div>
			</TabsContent>
			<TabsContent value="code">
				<div class="viewer__code">
					{#if source}
						<CodeSnippet code={source} language="svelte" />
					{:else}
						<p class="viewer__note">Loading source.</p>
					{/if}
				</div>
			</TabsContent>
		{/if}
	</Tabs>

	<nav class="viewer__pager" aria-label="Demos">
		{#if prev}
			<Button size="sm" variant="outlined" href={`/gallery/${prev}/`} aria-label={`Previous: ${prev}`}>
				{#snippet leading()}<ArrowLeft size={14} aria-hidden="true" />{/snippet}
				Previous
			</Button>
		{:else}<span></span>{/if}
		<span class="viewer__hint sk-caption">Left and right arrow keys move between demos</span>
		{#if next}
			<Button size="sm" variant="outlined" href={`/gallery/${next}/`} aria-label={`Next: ${next}`}>
				Next
				{#snippet trailing()}<ArrowRight size={14} aria-hidden="true" />{/snippet}
			</Button>
		{:else}<span></span>{/if}
	</nav>
</div>

<style>
	.viewer {
		display: grid;
		gap: var(--ca-space-4);
		min-width: 0;
	}
	.viewer__crumbs a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ca-text-secondary);
		text-decoration: none;
	}
	.viewer__crumbs a:hover {
		color: var(--ca-brand-text);
	}
	.viewer__title {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ca-space-3);
	}
	.viewer__title h1 {
		margin: 0;
		font-size: var(--ca-font-size-h3);
	}
	.viewer__num {
		padding: var(--ca-space-1) var(--ca-space-3);
		background: var(--ca-brand-fill);
		color: var(--ca-brand-contrast);
		font-family: var(--ca-font-mono);
		font-size: var(--ca-font-size-caption);
		letter-spacing: 0.08em;
	}
	.viewer__summary {
		margin: var(--ca-space-2) 0 0;
		max-width: 46rem;
		color: var(--ca-text-secondary);
	}
	.viewer__tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ca-space-2);
		margin: var(--ca-space-2) 0 0;
		padding: 0;
		list-style: none;
	}
	.viewer__tags li {
		padding: 0 var(--ca-space-2);
		border-radius: var(--ca-radius-pill);
		font-family: var(--ca-font-mono);
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-secondary);
		box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
	}
	.viewer__bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ca-space-3);
	}
	.viewer__preset {
		min-width: 10rem;
	}
	.viewer__spacer {
		flex: 1;
	}
	.viewer__rm {
		color: var(--ca-text-secondary);
	}
	/* Same height as the stage: the page never jumps when the stage mounts. */
	.viewer__reserve {
		height: calc(var(--reserve-h) + var(--ca-space-12));
	}
	.viewer__panel {
		display: grid;
		gap: var(--ca-space-3);
		min-width: 0;
	}
	.viewer__h {
		margin: var(--ca-space-3) 0 0;
		font-size: var(--ca-font-size-h5);
	}
	.viewer__prompt {
		margin: 0;
		padding: var(--ca-space-4);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-family: var(--ca-font-mono);
		font-size: var(--ca-font-size-caption);
		background: var(--ca-surface-container, transparent);
		border-radius: var(--ca-radius-md);
	}
	.viewer__parts,
	.viewer__spec,
	.viewer__related {
		display: grid;
		gap: var(--ca-space-2);
		margin: 0;
		padding-inline-start: var(--ca-space-5);
	}
	.viewer__parts code {
		margin-inline-start: var(--ca-space-2);
		font-family: var(--ca-font-mono);
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-secondary);
	}
	.viewer__code {
		min-height: 20rem;
	}
	.viewer__note {
		margin: 0;
		color: var(--ca-text-secondary);
	}
	.viewer__pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ca-space-3);
	}
	.viewer__hint {
		text-align: center;
	}
</style>
