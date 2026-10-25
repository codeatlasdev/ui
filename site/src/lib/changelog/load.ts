// Astro-side loader: reads the post collection, the generated data files and packages/ui/CHANGELOG.md, and hands them
// to the pure merge. Build time only (the pages are prerendered); the edge functions never import this file.

import { type CollectionEntry, getCollection } from "astro:content";
import { readFileSync } from "node:fs";
import { mdxToProse } from "../../../../packages/ui/scripts/changelog-markdown.ts";
import { parseChangelogMd } from "../../../functions/_lib/changelog";
import { mergeReleases } from "./merge.ts";
import type { PostMeta, ReleaseData, ReleasePage } from "./model.ts";

const dataFiles = import.meta.glob<ReleaseData>("../../data/changelog/*.json", {
	eager: true,
	import: "default",
});

/** Every release, newest first, and the post entries (to render their MDX) by version. */
export interface LoadedChangelog {
	pages: ReleasePage[];
	posts: Map<string, CollectionEntry<"changelog">>;
	/** The prose of each post (the MDX body as plain markdown), for the agent twin. */
	prose: Record<string, string>;
}

/** `packages/ui/CHANGELOG.md` is read from the checkout; the site always builds from `site/` under the repo root. */
const changelogSections = (): Record<string, string> =>
	Object.fromEntries(
		parseChangelogMd(readFileSync("../packages/ui/CHANGELOG.md", "utf8")).map((r) => [
			r.version,
			r.body,
		])
	);

let cache: Promise<LoadedChangelog> | undefined;

export function loadChangelog(): Promise<LoadedChangelog> {
	cache ??= (async () => {
		const entries = await getCollection("changelog");
		const meta: Record<string, PostMeta & { description: string }> = {};
		const posts = new Map<string, CollectionEntry<"changelog">>();
		for (const e of entries) {
			// The glob loader slugifies the id (`4.6.0` becomes `460`), so the file name is read from the path.
			const file = e.filePath
				?.split("/")
				.pop()
				?.replace(/\.mdx$/, "");
			if (file !== e.data.version)
				throw new Error(
					`content/changelog/${file}.mdx declares version ${e.data.version}: the file name is the URL`
				);
			meta[e.data.version] = e.data;
			posts.set(e.data.version, e);
		}
		const data: Record<string, ReleaseData> = {};
		for (const d of Object.values(dataFiles)) data[d.version] = d;
		const prose = Object.fromEntries([...posts].map(([v, e]) => [v, mdxToProse(e.body ?? "")]));
		return {
			pages: mergeReleases({ posts: meta, data, changelog: changelogSections() }),
			posts,
			prose,
		};
	})();
	return cache;
}
