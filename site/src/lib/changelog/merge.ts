// Pure merge of the three sources of a release into one `ReleasePage` (no Astro, no I/O: the page, the feed, the
// llms endpoint, the MCP build and the tests all call it with data they loaded themselves).
import {
	channelOf,
	cmpVersionDesc,
	countsOf,
	type Highlight,
	type PostMeta,
	type ReleaseData,
	type ReleasePage,
} from "./model.ts";

export interface Sources {
	/** Frontmatter of `content/changelog/<version>.mdx`, keyed by version. */
	posts: Record<string, PostMeta & { description: string }>;
	/** `data/changelog/<version>.json`, keyed by version. */
	data: Record<string, ReleaseData>;
	/** `packages/ui/CHANGELOG.md` split per version (Changesets format), keyed by version. */
	changelog: Record<string, string>;
}

/** Highlights a release with no post gets: the first changesets of the CHANGELOG, as written, so the card is never empty. */
export function fallbackHighlights(changelogMd: string): Highlight[] {
	const items = changelogMd.match(/^- [0-9a-f]{7}: .+$/gm) ?? [];
	return items.slice(0, 3).map((line, i) => {
		const text = line.replace(/^- [0-9a-f]{7}: /, "");
		const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
		const title = first.length > 70 ? `${first.slice(0, 67).trimEnd()}...` : first;
		return { id: `change-${i + 1}`, title: title.replace(/[`*_]/g, ""), summary: first };
	});
}

/** A release with no post: the version, what the generated data and the CHANGELOG know. */
const bare = (version: string, changelogMd: string, data: ReleaseData | null): ReleasePage => {
	const counts = countsOf(data, changelogMd);
	const what = counts.changes
		? `${counts.changes} changes in ${counts.prs} pull requests`
		: `${counts.changesets} changes`;
	return {
		version,
		date: data?.date ?? "",
		channel: channelOf(version),
		headline: `@codeatlasdev/ui ${version}`,
		lede: `${what}. This release has no written post; the list below is generated from the changelog.`,
		hero: "generic",
		highlights: fallbackHighlights(changelogMd),
		headlineNumbers: [],
		behaviour: [],
		counts,
		data,
		hasPost: false,
		changelogMd,
	};
};

export function mergeReleases(src: Sources): ReleasePage[] {
	const versions = new Set([
		...Object.keys(src.posts),
		...Object.keys(src.data),
		...Object.keys(src.changelog),
	]);
	return [...versions].sort(cmpVersionDesc).map((version) => {
		const data = src.data[version] ?? null;
		const md = src.changelog[version] ?? "";
		const post = src.posts[version];
		if (!post) return bare(version, md, data);
		return {
			version,
			date: post.date,
			channel: channelOf(version),
			headline: post.headline,
			lede: post.lede,
			hero: post.hero,
			highlights: post.highlights,
			headlineNumbers: post.headlineNumbers,
			behaviour: post.behaviour,
			counts: countsOf(data, md),
			data,
			hasPost: true,
			changelogMd: md,
		};
	});
}
