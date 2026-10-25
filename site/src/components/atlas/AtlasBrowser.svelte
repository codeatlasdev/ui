<script lang="ts">
	import { announce, Button, EmptyState, Select, TextField } from "@codeatlasdev/ui";
	import { onMount } from "svelte";
	import {
		CATEGORIES,
		type Category,
		facetCounts,
		filterTerms,
		type Filters,
		SCORE_LABEL,
		SCORE_NAMES,
		type ScoreName,
		STANDARDIZATION_LABEL,
		STANDARDIZATIONS,
		type Standardization,
		type Status,
		STATUS_LABEL,
		STATUSES,
		type Term,
		type Trend,
		TREND_LABEL,
		TRENDS,
	} from "~/data/atlas/atlas";

	interface Props {
		terms: readonly Term[];
		/** `/atlas/<slug>/` of each term id. */
		hrefs: Record<string, string>;
	}
	let { terms, hrefs }: Props = $props();

	// The three scales are relative editorial judgements, so the filter is a coarse band, not a number.
	const BANDS = {
		any: undefined,
		low: [1, 2],
		mid: [3, 3],
		high: [4, 5],
	} as const;
	type Band = keyof typeof BANDS;
	const bandOptions = [
		{ value: "any", label: "Any" },
		{ value: "low", label: "Low (1 to 2)" },
		{ value: "mid", label: "Medium (3)" },
		{ value: "high", label: "High (4 to 5)" },
	];

	let query = $state("");
	let category = $state("all");
	let status = $state("all");
	let trend = $state("all");
	let standardization = $state("all");
	let bands = $state<Record<ScoreName, Band>>({ complexity: "any", expressiveness: "any", density: "any" });

	const pick = <T extends string>(v: string, list: readonly T[]) => (list.includes(v as T) ? (v as T) : undefined);

	const filters = $derived<Filters>({
		query,
		category: pick<Category>(category, CATEGORIES),
		status: pick<Status>(status, STATUSES),
		trend: pick<Trend>(trend, TRENDS),
		standardization: pick<Standardization>(standardization, STANDARDIZATIONS),
		complexity: BANDS[bands.complexity] as [number, number] | undefined,
		expressiveness: BANDS[bands.expressiveness] as [number, number] | undefined,
		density: BANDS[bands.density] as [number, number] | undefined,
	});
	const visible = $derived(filterTerms(terms, filters));
	const active = $derived(
		[query.trim(), category, status, trend, standardization, ...Object.values(bands)].filter(
			(v) => v && v !== "all" && v !== "any"
		).length
	);

	const options = (labels: Record<string, string> | readonly string[], counts: Map<string, number>) => [
		{ value: "all", label: "All" },
		...(Array.isArray(labels) ? labels.map((l) => [l, l] as const) : Object.entries(labels)).map(
			([value, label]) => ({ value, label: `${label} (${counts.get(value) ?? 0})` })
		),
	];
	const categoryOptions = $derived(options(CATEGORIES, facetCounts(terms, "category")));
	const statusOptions = $derived(options(STATUS_LABEL, facetCounts(terms, "status")));
	const trendOptions = $derived(options(TREND_LABEL, facetCounts(terms, "trend")));
	const standardizationOptions = $derived(
		options(STANDARDIZATION_LABEL, facetCounts(terms, "standardization"))
	);

	function reset() {
		query = "";
		category = status = trend = standardization = "all";
		bands = { complexity: "any", expressiveness: "any", density: "any" };
	}

	// Filters live in the URL so a filtered view can be shared or reopened.
	const KEYS = ["q", "category", "status", "trend", "standardization", ...SCORE_NAMES] as const;
	onMount(() => {
		const p = new URLSearchParams(location.search);
		query = p.get("q") ?? "";
		category = p.get("category") ?? "all";
		status = p.get("status") ?? "all";
		trend = p.get("trend") ?? "all";
		standardization = p.get("standardization") ?? "all";
		for (const n of SCORE_NAMES) {
			const v = p.get(n);
			if (v && v in BANDS) bands[n] = v as Band;
		}
	});
	$effect(() => {
		const state: Record<string, string> = {
			q: query.trim(),
			category,
			status,
			trend,
			standardization,
			...bands,
		};
		const url = new URL(location.href);
		for (const k of KEYS) {
			const v = state[k];
			if (v && v !== "all" && v !== "any") url.searchParams.set(k, v);
			else url.searchParams.delete(k);
		}
		history.replaceState(history.state, "", url);
	});
	let announced = $state(false);
	$effect(() => {
		const n = visible.length;
		if (!announced) {
			announced = true;
			return;
		}
		announce(`${n} of ${terms.length} terms shown`);
	});
</script>

<section class="atlas-browser" aria-label="Browse the atlas">
	<form class="atlas-browser__filters" role="search" onsubmit={(e) => e.preventDefault()}>
		<TextField
			label="Search the atlas"
			placeholder="Term, trait, sector or definition"
			type="search"
			bind:value={query}
		/>
		<div class="atlas-browser__grid">
			<Select label="Category" options={categoryOptions} bind:value={category} />
			<Select label="Status in 2026" options={statusOptions} bind:value={status} />
			<Select label="Trend 2027 to 2030" options={trendOptions} bind:value={trend} />
			<Select label="How standard is the term" options={standardizationOptions} bind:value={standardization} />
			{#each SCORE_NAMES as name (name)}
				<Select
					label={`${SCORE_LABEL[name]} (heuristic)`}
					options={bandOptions}
					value={bands[name]}
					onchange={(v) => (bands[name] = v as Band)}
				/>
			{/each}
		</div>
		<p class="atlas-browser__bar">
			<span class="atlas-browser__count" data-testid="atlas-count">{visible.length} of {terms.length} terms</span>
			{#if active}<Button variant="ghost" size="sm" type="button" onclick={reset}>Clear {active} filter{active === 1 ? "" : "s"}</Button>{/if}
		</p>
	</form>

	{#if visible.length === 0}
		<EmptyState title="No term matches" description="Clear a filter or search for a shorter word." />
	{:else}
		<ul class="atlas-browser__list">
			{#each visible as t (t.id)}
				<li class="atlas-card">
					<p class="atlas-card__meta">
						<span class="atlas-card__id">{t.id}</span>
						{t.category}: {t.subcategory}
					</p>
					<h2 class="atlas-card__title"><a href={hrefs[t.id]}>{t.term}</a></h2>
					<p class="atlas-card__def">{t.definition}</p>
					<p class="atlas-card__foot">
						<span>{STATUS_LABEL[t.status]}</span>
						<span>Trend: {TREND_LABEL[t.trend]}</span>
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.atlas-browser {
		display: grid;
		gap: var(--ca-space-5);
	}
	.atlas-browser__filters {
		display: grid;
		gap: var(--ca-space-4);
	}
	.atlas-browser__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--ca-space-3);
	}
	.atlas-browser__bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ca-space-3);
		margin: 0;
	}
	.atlas-browser__count {
		color: var(--ca-text-secondary);
		font-size: var(--ca-font-size-body2);
	}
	.atlas-browser__list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: var(--ca-space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.atlas-card {
		position: relative;
		display: grid;
		align-content: start;
		gap: var(--ca-space-2);
		padding: var(--ca-space-4);
		border: var(--ca-border-width) solid var(--ca-outline-subtle);
		border-radius: var(--ca-radius-md);
		background: var(--ca-surface-raised);
	}
	.atlas-card:focus-within,
	.atlas-card:hover {
		border-color: var(--ca-outline-strong);
	}
	.atlas-card__meta {
		margin: 0;
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-secondary);
	}
	.atlas-card__id {
		font-family: var(--ca-font-mono);
		margin-inline-end: var(--ca-space-1);
	}
	.atlas-card__title {
		margin: 0;
		font-size: var(--ca-font-size-h5);
	}
	/* The title link covers the card: one real link per card for keyboard and screen readers. */
	.atlas-card__title a::after {
		content: "";
		position: absolute;
		inset: 0;
	}
	.atlas-card__def {
		margin: 0;
		color: var(--ca-text-body);
		font-size: var(--ca-font-size-body2);
	}
	.atlas-card__foot {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ca-space-3);
		margin: 0;
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-secondary);
	}
</style>
