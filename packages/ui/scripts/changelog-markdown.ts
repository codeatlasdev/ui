// A release as plain markdown for agents: one file per version (`/llms/changelog/<version>.txt`), the digest of every
// release (`/llms/changelog.txt`) and the file the MCP `get_release` tool serves offline (`dist/releases.json`).
// `buildReleaseFile` runs in Bun (the manifest build reads the post frontmatter with `Bun.YAML`), so the MCP binary, which
// runs on Node, never parses YAML; the Astro prerender runs on Node too and uses `releaseFileOf` with the collection it
// already parsed. The same text feeds the site endpoint, the Atom feed's plain twin and the tests.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseChangelogMd } from "../../../site/functions/_lib/changelog.ts";
import { mergeReleases, type Sources } from "../../../site/src/lib/changelog/merge.ts";
import {
	groupByArea,
	issueUrl,
	llmsPath,
	type PostMeta,
	prUrl,
	type ReleaseData,
	type ReleasePage,
	releaseUrl,
	SITE,
} from "../../../site/src/lib/changelog/model.ts";

/**
 * The repo root. From source this file sits at packages/ui/scripts; inside the Astro prerender bundle (site/dist/.prerender)
 * `import.meta.url` points into the build output, so the root is found by walking up from the working directory (the
 * site build runs in `site/`, the manifest build in `packages/ui/`) to the folder that holds `packages/ui/CHANGELOG.md`.
 */
function findRoot(): string {
	const here = dirname(fileURLToPath(import.meta.url));
	const fromSource = resolve(here, "../../..");
	if (existsSync(join(fromSource, "packages/ui/CHANGELOG.md"))) return fromSource;
	for (let dir = process.cwd(); ; dir = dirname(dir)) {
		if (existsSync(join(dir, "packages/ui/CHANGELOG.md"))) return dir;
		if (dirname(dir) === dir)
			throw new Error("changelog-markdown: repo root (packages/ui/CHANGELOG.md) not found");
	}
}
export const CHANGELOG_INDEX_PATH = "/llms/changelog.txt";

interface Frontmatter {
	meta: PostMeta & { description: string };
	/** MDX body after the frontmatter, imports and component tags removed: the prose a person reads. */
	prose: string;
}

/** Splits `---` frontmatter off an MDX post; the body keeps its markdown and loses imports and JSX wrappers. */
export function readPost(source: string): Frontmatter {
	const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source);
	if (!m) throw new Error("changelog post has no frontmatter");
	const meta = Bun.YAML.parse(m[1] as string) as Frontmatter["meta"];
	return {
		meta: { behaviour: [], headlineNumbers: [], ...meta },
		prose: mdxToProse(m[2] as string),
	};
}

/**
 * The prose of a post for an agent: imports dropped, `<Section>` becomes a heading, `<Bench>` and `<Numbers>` keep
 * their figures and conditions as a list, everything else that is JSX (live demos, scenes, comparisons) is removed
 * and the code blocks stay. A person-only element must not leave a hole in the text.
 */
export function mdxToProse(body: string): string {
	let out = body.replace(/^import\s.+$/gm, "");
	out = out.replace(/<Section\b[^>]*\btitle="([^"]+)"[^>]*>/g, "\n## $1\n");
	out = out.replace(/<\/Section>/g, "");
	out = out.replace(/<Bench\b([\s\S]*?)\/>/g, (_all, attrs: string) => benchToList(attrs));
	out = out.replace(/<(Live|Compare|Scene\w*|Figure)\b[^>]*>[\s\S]*?<\/\1>/g, "");
	out = out.replace(/<[A-Z]\w*\b[^>]*\/>/g, "");
	return out.replace(/\n{3,}/g, "\n\n").trim();
}

/** `<Bench title unit rows={[...]} conditions />` as markdown: the rows and the conditions they were taken under. */
function benchToList(attrs: string): string {
	const str = (k: string) => new RegExp(`${k}=(?:"([^"]*)"|\\{\`([^\`]*)\`\\})`).exec(attrs);
	const title = str("title");
	const unit = str("unit");
	const cond = str("conditions");
	const rows = [
		...attrs.matchAll(
			/\{\s*label:\s*"([^"]+)"\s*,\s*value:\s*([\d.]+)(?:\s*,\s*display:\s*"([^"]+)")?/g
		),
	];
	return [
		"",
		`**${title?.[1] ?? title?.[2] ?? "Measured"}**`,
		"",
		...rows.map((r) => `- ${r[1]}: ${r[3] ?? `${r[2]} ${unit?.[1] ?? ""}`.trim()}`),
		"",
		`Conditions: ${cond?.[1] ?? cond?.[2] ?? "(see the page)"}`,
		"",
	].join("\n");
}

/** Reads every source of the site checkout: posts, generated data, CHANGELOG.md. */
export function readSources(root = findRoot()): {
	sources: Sources;
	prose: Record<string, string>;
} {
	const posts: Sources["posts"] = {};
	const prose: Record<string, string> = {};
	const dir = join(root, "site/src/content/changelog");
	if (existsSync(dir))
		for (const f of readdirSync(dir).filter((n) => n.endsWith(".mdx"))) {
			const { meta, prose: p } = readPost(readFileSync(join(dir, f), "utf8"));
			posts[meta.version] = meta;
			prose[meta.version] = p;
		}
	const data: Sources["data"] = {};
	const ddir = join(root, "site/src/data/changelog");
	if (existsSync(ddir))
		for (const f of readdirSync(ddir).filter((n) => n.endsWith(".json"))) {
			const d = JSON.parse(readFileSync(join(ddir, f), "utf8")) as ReleaseData;
			data[d.version] = d;
		}
	const changelog = Object.fromEntries(
		parseChangelogMd(readFileSync(join(root, "packages/ui/CHANGELOG.md"), "utf8")).map((r) => [
			r.version,
			r.body,
		])
	);
	return { sources: { posts, data, changelog }, prose };
}

const fmtCounts = (p: ReleasePage) =>
	p.counts.changes
		? `${p.counts.changes} changes in ${p.counts.prs} pull requests (${p.counts.features} features, ${p.counts.fixes} fixes), ${p.counts.changesets} changesets`
		: `${p.counts.changesets} changesets`;

/** One release: header, TL;DR, the post, behaviour changes, upgrade, and the full generated list with PR and issue links. */
export function buildReleaseMarkdown(p: ReleasePage, prose = ""): string {
	return [
		`# @codeatlasdev/ui ${p.version}: ${p.headline}`,
		"",
		`${p.date ? `Released ${p.date}. ` : ""}Page: ${releaseUrl(p.version)}. Index: ${SITE}${CHANGELOG_INDEX_PATH}. ${fmtCounts(p)}.`,
		"",
		p.lede,
		"",
		...(p.headlineNumbers.length
			? [
					"## Numbers",
					"",
					...p.headlineNumbers.map((n) => `- ${n.label}: ${n.value}. ${n.note}`),
					"",
				]
			: []),
		"## In short",
		"",
		...p.highlights.map((h, i) => `${i + 1}. ${h.title}. ${h.summary}`),
		"",
		...(prose ? [prose, ""] : []),
		...(p.behaviour.length
			? [
					"## Behaviour changes",
					"",
					...p.behaviour.flatMap((b) => [`- ${b.title}. ${b.body} What to do: ${b.fix}`]),
					"",
				]
			: []),
		"## Upgrade",
		"",
		"```bash",
		`bun add @codeatlasdev/ui@${p.version}`,
		"```",
		"",
		"Across majors: `bunx @codeatlasdev/ui migrate --from <major> --to <major>`, or the MCP tool `get_migration`.",
		"",
		...(p.data
			? [
					"## All changes",
					"",
					`Between ${p.data.from} and ${p.data.to}, grouped by area.`,
					"",
					...groupByArea(p.data.changes).flatMap((g) => [
						`### ${g.label}`,
						"",
						...g.changes.map(
							(c) =>
								`- ${c.kind}: ${c.title} (${prUrl(c.pr)}${c.issue && c.issue !== c.pr ? `, closes ${issueUrl(c.issue)}` : ""})`
						),
						"",
					]),
				]
			: p.changelogMd
				? ["## Changesets", "", p.changelogMd, ""]
				: []),
	].join("\n");
}

/** The digest: every release, newest first, linking its own file. */
export function buildChangelogIndex(pages: readonly ReleasePage[]): string {
	return [
		"# Changelog",
		"",
		`> ${pages.length} releases of @codeatlasdev/ui, newest first. One file per release at ${SITE}/llms/changelog/<version>.txt, the MCP tool \`get_release(version)\`, JSON at ${SITE}/changelog.json and an Atom feed at ${SITE}/changelog/feed.xml.`,
		"",
		...pages.flatMap((p) => [
			`## ${p.version}${p.date ? ` (${p.date})` : ""}: ${p.headline}`,
			"",
			`- File: ${SITE}${llmsPath(p.version)}. Page: ${releaseUrl(p.version)}.`,
			`- ${fmtCounts(p)}.`,
			...p.highlights.slice(0, 3).map((h) => `- ${h.title}`),
			"",
		]),
	].join("\n");
}

/** What `dist/releases.json` holds: enough for `get_release` to answer with no network. */
export interface ReleaseFile {
	index: string;
	versions: string[];
	releases: Record<string, string>;
}

/** The file from releases already merged (the site's own loader) and the prose of each post: no filesystem, no YAML. */
export function releaseFileOf(
	pages: readonly ReleasePage[],
	prose: Record<string, string>
): ReleaseFile {
	return {
		index: buildChangelogIndex(pages),
		versions: pages.map((p) => p.version),
		releases: Object.fromEntries(
			pages.map((p) => [p.version, buildReleaseMarkdown(p, prose[p.version])])
		),
	};
}

/** From the repo checkout, in Bun (the manifest build and the tests): reads the posts with `Bun.YAML`. */
export function buildReleaseFile(root = findRoot()): ReleaseFile {
	const { sources, prose } = readSources(root);
	return releaseFileOf(mergeReleases(sources), prose);
}
