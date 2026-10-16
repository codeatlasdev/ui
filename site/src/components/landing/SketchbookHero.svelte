<script lang="ts">
	// The hero: an open sketchbook. Left page = real gallery cards with Pick; right page = exactly what
	// the AI receives for the picks (the same text the gallery copies, plus the head of the last
	// pick's reference). Nothing here is imagery: the previews are the demos themselves.
	import { Checkbox, CopyButton } from "@codeatlasdev/ui";
	import GalleryPreview from "../gallery/GalleryPreview.svelte";
	import { copyText } from "../gallery/picks";

	interface Element {
		id: string;
		title: string;
		group: string;
		page: string;
		variant: string;
		summary: string;
		/** Same-site path + hash of the live docs section. */
		demo: string;
	}
	interface Props {
		elements: Element[];
	}
	let { elements }: Props = $props();

	const REFERENCE_LINES = 12;

	let picks = $state<string[]>(["001"]);
	let reference = $state("");
	let overflow = $state(false);
	let body = $state<HTMLElement>();
	const cache = new Map<string, string>();

	const sorted = $derived([...picks].sort());
	const picked = $derived(new Set(picks));
	const last = $derived(picks[picks.length - 1]);
	const head = $derived(
		copyText(
			sorted.flatMap((id) => {
				const e = elements.find((x) => x.id === id);
				return e ? [{ id, title: e.title }] : [];
			}),
		),
	);
	const text = $derived(reference ? `${head}\n\n${reference}` : head);

	function toggle(id: string, on: boolean) {
		picks = on ? [...picks.filter((p) => p !== id), id] : picks.filter((p) => p !== id);
	}

	// The reference of the last picked id, cut to its first lines. Cached per id; offline shows the link.
	$effect(() => {
		const id = last;
		if (!id) {
			reference = "";
			return;
		}
		const demo = elements.find((e) => e.id === id)?.demo ?? "";
		const hit = cache.get(id);
		if (hit !== undefined) {
			reference = hit;
			return;
		}
		let live = true;
		fetch(`/api/v1/en/e/${id}.txt`)
			.then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
			.then((t) => t.split("\n").slice(0, REFERENCE_LINES).join("\n"))
			.catch(() => `Reference unavailable offline: ${demo}`)
			.then((t) => {
				cache.set(id, t);
				if (live) reference = t;
			});
		return () => {
			live = false;
		};
	});

	// A scrolling region must be keyboard-focusable (axe scrollable-region-focusable).
	$effect(() => {
		text;
		if (body) overflow = body.scrollHeight > body.clientHeight;
	});
</script>

<div class="book sk-page">
	<ul class="book__cards">
		{#each elements as e (e.id)}
			<li class="book__card sk-page">
				<article aria-labelledby={`book-${e.id}`}>
					<span class="sk-page__num">#{e.id}</span>
					<h3 id={`book-${e.id}`} class="book__title">{e.title}</h3>
					<div class="book__preview">
						<GalleryPreview path={`${e.group}/${e.page}/${e.variant}`} title={e.title} />
					</div>
					<Checkbox label={`Pick #${e.id}`} checked={picked.has(e.id)} onchange={(on) => toggle(e.id, on)} />
				</article>
			</li>
		{/each}
	</ul>

	<div class="book__prompt sk-hatch">
		<p class="sk-eyebrow">What your AI receives</p>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre
			class="book__text"
			bind:this={body}
			tabindex={overflow ? 0 : undefined}
			aria-live="polite"
			aria-label="Prompt for your AI">{text}</pre>
		<div class="book__actions">
			<CopyButton value={text} label="Copy picks" variant="filled" />
			<a href={`/gallery/?pick=${sorted.join(",")}`}>Continue in the gallery</a>
		</div>
	</div>
</div>

<style>
	.book {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		min-inline-size: 0;
		padding: 0;
	}
	@media (min-width: 900px) {
		.book {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
		.book__prompt {
			border-inline-start: var(--ca-border-width-strong) solid var(--ca-outline-strong);
		}
	}
	.book__cards {
		display: grid;
		gap: var(--ca-space-4);
		margin: 0;
		padding: var(--ca-space-5) var(--ca-space-5) var(--ca-space-5) calc(var(--sk-spiral) + var(--ca-space-4));
		list-style: none;
		min-inline-size: 0;
	}
	/* Each card is a sheet inside the sheet: the nested spiral and shadow are off, the tab stays. */
	.book__card {
		padding: var(--ca-space-8) var(--ca-space-4) var(--ca-space-4);
		box-shadow: none;
		background: var(--ca-surface-base);
	}
	.book__card::before {
		content: none;
	}
	.book__card article {
		display: grid;
		gap: var(--ca-space-2);
	}
	.book__title {
		margin: 0;
		font-size: var(--ca-font-size-h6);
	}
	.book__preview {
		display: flex;
		align-items: center;
		/* Fixed box: lazily mounted demos must not shift the page (CLS 0 while scrolling and tapping). */
		height: 14rem;
		contain: layout paint;
		min-inline-size: 0;
		padding: var(--ca-space-4);
		border-radius: var(--ca-radius-md);
		box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
		overflow: hidden;
	}
	.book__prompt {
		position: relative;
		display: grid;
		align-content: start;
		gap: var(--ca-space-3);
		min-inline-size: 0;
		padding: var(--ca-space-5);
	}
	.book__text {
		margin: 0;
		max-block-size: 24rem;
		overflow: auto;
		padding: var(--ca-space-3);
		background: var(--ca-surface-sunken);
		color: var(--ca-text-body);
		font-family: var(--ca-font-mono);
		font-size: var(--ca-font-size-caption);
		line-height: 1.6;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.book__text:focus-visible {
		outline: 2px solid var(--ca-focus-ring);
		outline-offset: 2px;
	}
	.book__actions {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ca-space-3) var(--ca-space-5);
	}
	.book__actions a {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--ca-touch-target);
		color: var(--ca-brand-text);
	}
</style>
