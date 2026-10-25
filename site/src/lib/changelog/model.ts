// The release page model: one shape for every consumer (the post page, the index cards, the feed, /changelog.json,
// /llms/changelog/<version>.txt and the MCP `get_release`). Pure TypeScript, no Astro or Svelte imports, so the unit
// tests, the MCP build and the edge functions can all load it.
//
// Two sources meet here:
//   post  site/src/content/changelog/<version>.mdx   hand-written: headline, highlights, TL;DR, the long form.
//   data  site/src/data/changelog/<version>.json     generated (scripts/changelog-data.ts) from the commits between two
//                                                    tags: every change with its PR and issue, grouped by area.
// A version with no post still renders: the page falls back to the data file, then to packages/ui/CHANGELOG.md.

export const SITE = "https://ui.codeatlas.com.br";
export const REPO = "codeatlasdev/ui";

/** Areas a change is filed under, in display order. `label` is the heading of the group on the page. */
export const AREAS = [
	{ id: "theme", label: "Theme and Studio" },
	{ id: "index", label: "UI index and gallery" },
	{ id: "styles", label: "Design styles, atlas and evidence" },
	{ id: "components", label: "Components" },
	{ id: "overlays", label: "Overlays and layers" },
	{ id: "forms", label: "Forms and inputs" },
	{ id: "shell", label: "App shell and layout" },
	{ id: "map", label: "Map and charts" },
	{ id: "sound", label: "Sound" },
	{ id: "a11y", label: "Accessibility" },
	{ id: "agents", label: "Agents, MCP and docs" },
	{ id: "cli", label: "CLI and migration" },
	{ id: "tests", label: "Tests and release gates" },
	{ id: "deps", label: "Dependencies" },
] as const;
export type AreaId = (typeof AREAS)[number]["id"];
export const areaLabel = (id: AreaId): string => AREAS.find((a) => a.id === id)?.label ?? id;

export type ChangeKind = "feat" | "fix" | "docs" | "chore" | "test" | "perf";

/** One change: a merged pull request (and the issue it closes), as the generated data records it. */
export interface Change {
	/** Subject without the conventional-commit prefix, as merged. */
	title: string;
	kind: ChangeKind;
	area: AreaId;
	/** Pull request number, from the `(#n)` the squash merge appends. */
	pr: number;
	/** Issue the pull request closed, when the subject or body names one. */
	issue?: number;
	/** ISO date the change landed on main. */
	date: string;
}

/** The generated data of one release (`site/src/data/changelog/<version>.json`). */
export interface ReleaseData {
	version: string;
	/** Tag the range starts at (exclusive) and the commit it ends at, so the numbers can be re-derived. */
	from: string;
	to: string;
	/** ISO date of the release (the day it was cut); `""` until the tag exists. */
	date: string;
	changes: Change[];
	/** Number of changesets the release carried, by bump (`minor`, `patch`, `major`). */
	changesets: { major: number; minor: number; patch: number };
}

/** A stat on the headline row: a number, what it counts and the condition it holds under. */
export interface HeadlineNumber {
	value: string;
	label: string;
	/** The conditions the number was taken under, or where it comes from. Never omitted. */
	note: string;
}

/** A highlight, as the frontmatter of the post lists it. The long form lives in the MDX body under the same id. */
export interface Highlight {
	id: string;
	title: string;
	/** One sentence for the index card and the TL;DR. */
	summary: string;
	/** Optional scene id drawn on the section (see components/changelog/scenes). */
	scene?: string;
}

export interface BehaviourChange {
	title: string;
	/** What changes for an app that did nothing about it. */
	body: string;
	/** What to do, or "nothing". */
	fix: string;
}

export interface PostMeta {
	version: string;
	/** ISO date the post is dated (stable: it is the URL's identity together with the version). */
	date: string;
	headline: string;
	/** A paragraph under the headline: what the release is about, in plain words. */
	lede: string;
	/** Scene id of the hero illustration (components/changelog/scenes/<hero>.astro). */
	hero: string;
	highlights: Highlight[];
	headlineNumbers: HeadlineNumber[];
	behaviour: BehaviourChange[];
}

/** Everything a consumer needs to draw one release, whatever the sources had. */
export interface ReleasePage {
	version: string;
	date: string;
	channel: string;
	headline: string;
	lede: string;
	/** Scene id of the hero; releases with no post get the generic one. */
	hero: string;
	highlights: Highlight[];
	headlineNumbers: HeadlineNumber[];
	behaviour: BehaviourChange[];
	/** Counts for the index card. */
	counts: { changes: number; features: number; fixes: number; prs: number; changesets: number };
	data: ReleaseData | null;
	/** The release has a hand-written post. */
	hasPost: boolean;
	/** `CHANGELOG.md` body of the version, markdown (Changesets format), used when there is no data file or as the changeset list. */
	changelogMd: string;
}

export const versionSlug = (v: string) => v;
export const releasePath = (version: string) => `/changelog/${version}/`;
export const releaseUrl = (version: string) => `${SITE}${releasePath(version)}`;
export const llmsPath = (version: string) => `/llms/changelog/${version}.txt`;
export const ogSlug = (version: string) => `changelog-${version}`;

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
export const isVersion = (v: string) => SEMVER.test(v);
export const channelOf = (version: string): string =>
	SEMVER.exec(version)?.[4]?.split(".")[0] ?? "latest";

/** Newest first, SemVer precedence; a release outranks its own prereleases. */
export function cmpVersionDesc(a: string, b: string): number {
	const x = SEMVER.exec(a);
	const y = SEMVER.exec(b);
	if (!x || !y) return Number(!x) - Number(!y);
	for (let i = 1; i <= 3; i++) {
		const d = Number(y[i]) - Number(x[i]);
		if (d) return d;
	}
	if (!x[4] || !y[4]) return Number(!!x[4]) - Number(!!y[4]);
	return (y[4] as string).localeCompare(x[4] as string, "en", { numeric: true });
}

/** Counts shown on the index card, from the generated data (or the changeset count alone when there is none). */
export function countsOf(data: ReleaseData | null, changelogMd: string): ReleasePage["counts"] {
	const changesets = data
		? data.changesets.major + data.changesets.minor + data.changesets.patch
		: (changelogMd.match(/^- [0-9a-f]{7}:/gm)?.length ?? 0);
	if (!data) return { changes: 0, features: 0, fixes: 0, prs: 0, changesets };
	return {
		changes: data.changes.length,
		features: data.changes.filter((c) => c.kind === "feat").length,
		fixes: data.changes.filter((c) => c.kind === "fix").length,
		prs: new Set(data.changes.map((c) => c.pr)).size,
		changesets,
	};
}

/** Changes grouped by area in `AREAS` order; empty areas are dropped, rows inside keep their landing order (newest first). */
export function groupByArea(changes: Change[]): { id: AreaId; label: string; changes: Change[] }[] {
	return AREAS.map((a) => ({
		id: a.id,
		label: a.label,
		changes: changes.filter((c) => c.area === a.id),
	})).filter((g) => g.changes.length > 0);
}

/** `#123` as a link target on GitHub: the issue and PR namespaces share numbers, GitHub redirects either. */
export const prUrl = (n: number) => `https://github.com/${REPO}/pull/${n}`;
export const issueUrl = (n: number) => `https://github.com/${REPO}/issues/${n}`;

// ── Classification of a commit ──────────────────────────────────────────────────────────────────────
// scripts/changelog-data.ts calls these over `git log --name-only`; they live here so the rules are tested once and
// the generator holds no logic of its own. The files a change touched say where it belongs; the subject only breaks
// a tie.

const KINDS: ChangeKind[] = ["feat", "fix", "docs", "chore", "test", "perf"];

/**
 * `feat: test: title (#12)`: a squash subject is the pull request's type, then the issue title, which carries its
 * own. When the two disagree the issue's (what the work is) wins over a leading `feat`, which the PR template adds
 * to every pull request.
 */
export function parseSubject(
	subject: string
): { kind: ChangeKind; title: string; pr: number | null } | null {
	let s = subject.trim();
	const pr = /\s\(#(\d+)\)$/.exec(s);
	if (pr) s = s.slice(0, pr.index).trim();
	const kinds: ChangeKind[] = [];
	for (;;) {
		const m = /^([a-z]+)(?:\([^)]*\))?!?:\s+/.exec(s);
		if (!m || !KINDS.includes(m[1] as ChangeKind)) break;
		kinds.push(m[1] as ChangeKind);
		s = s.slice(m[0].length);
	}
	const first = kinds[0];
	if (!first) return null;
	const last = kinds[kinds.length - 1] as ChangeKind;
	return {
		kind: kinds.length > 1 && first === "feat" ? last : first,
		title: s,
		pr: pr ? Number(pr[1]) : null,
	};
}

/**
 * Subject rules, first match wins. The subject is what the author wrote the change as, so it outranks the files: a
 * feature PR touches tests, docs, generated files and the manifest, and every one of those would pull it elsewhere.
 */
const TITLE_RULES: [AreaId, RegExp][] = [
	["deps", /^bump \S+ from /i],
	[
		"a11y",
		/\b(a11y|axe\b|color-?contrast|contrast\b|label-content-name|touch target|accessible name|heading[- ]order|keyboard[- ]reach|scrollable-region|aria-label)/i,
	],
	[
		"tests",
		/\b(tests?|vrt|baselines?|budgets?|land gate|landShared|flaky|flakes|intermittently|e2e|route-impact|issue-land|test:changed|check:native|sleeps)\b/i,
	],
	["sound", /\bsound\b/i],
	[
		"theme",
		/\b(theme studio|theme island|theme presets?|typography|type scale|display font|density tokens?|component tokens|root font|editorial primitives|--ca-|tokens?\b)/i,
	],
	["map", /\b(map|maplibre|deck\.gl|mapstage)\b|\bsparkline\b|\bcharts?\b/i],
	["index", /\b(the index|gallery|index\.json|facets?|preview ?stage)\b/i],
	["styles", /\b(design (style|atlas)|atlas|evidence|concepts?|style pages)\b/i],
	["agents", /\b(llms|mcp|agents?|one-shot|manifest|recipes?|docs?:|workarounds?)\b/i],
	["cli", /\b(init|migrat\w*|codemods?|doctor|scaffold|lint\b)/i],
	[
		"overlays",
		/\b(dialog|alertdialog|drawer|sheet|popover|tooltip|hovercard|dropdown|overlay|modal|toast|layers?\b|menubar|navigationmenu|contextmenu|dnd|drag)/i,
	],
	[
		"forms",
		/\b(textfield|textarea|input ?group|form|checkbox|select|combobox|chip ?group|fileupload|slider|password|turnstile|avatar|badge|button|kbd|progress|stat\b|kpicard)/i,
	],
	[
		"shell",
		/\b(appshell|shell|rail|bottomnav|pageframe|pageshell|authlayout|kanban|table|carousel|resizable|aspectratio|image|card\b|header|nav)/i,
	],
];

/** Path rules, used only when the subject says nothing: a change filed as plain `fix:` with a generic title. */
const PATH_RULES: [AreaId, RegExp][] = [
	["sound", /(^|\/)lib\/sound\//],
	["map", /^packages\/ui\/src\/lib\/(map|charts)\//],
	["cli", /^packages\/ui\/src\/cli\//],
	["theme", /^packages\/ui\/src\/lib\/(theme|tokens|styles)\//],
	[
		"overlays",
		/^packages\/ui\/src\/lib\/components\/(Dialog|AlertDialog|Drawer|Sheet|Popover|Tooltip|HoverCard|DropdownMenu|ContextMenu|Menubar|NavigationMenu|Toast)\//,
	],
	[
		"forms",
		/^packages\/ui\/src\/lib\/(forms|components\/(TextField|TextArea|Checkbox|Select|Combobox|ChipGroup|FileUpload|Slider|Switch))/,
	],
	[
		"shell",
		/^packages\/ui\/src\/lib\/components\/(AppShell|PageShell|PageFrame|AuthLayout|Kanban|DataTable|SimpleTable|Carousel|ResizablePanels)/,
	],
];

/**
 * The pull requests the rules above file wrongly, read one by one and fixed here. A new release adds a row only when
 * its generated list shows a change under the wrong heading; `changelog.test.ts` fails on a number that is not in
 * any release's data, so a stale row cannot hide.
 */
export const AREA_OVERRIDES: Record<number, AreaId> = {
	// docs pages and tooling, not the component their title names
	600: "agents", // 14 docs pages emit the same heading id
	540: "tests", // Playwright worker count under CI
	500: "agents", // installation page: TypeScript major for Kit 3
	511: "agents", // template uses :global instead of Grid props
	504: "agents", // map recipe
	463: "agents", // button-group.mdx build failure
	437: "agents", // llms-full.txt shape
	485: "agents", // marketing header recipe
	534: "tests", // a11y routes spec timeout
	465: "tests", // site e2e gate
	439: "tests", // site build failed on a demo
	419: "tests", // suite poisoned by a demo import
	// products of a feature, filed under the feature
	478: "cli", // init: Kit 3 scaffold
	561: "agents", // docs: glass is one style among many
	// components the title names only by a word the rules read as something else
	552: "components", // reset layer pointer cursor
	567: "components", // nativeFeel cursor
	543: "tests", // global.css size budget
	554: "theme", // code surfaces guide and --ca-code-line-height
	565: "theme", // solid default without data-style
	556: "index", // one header across landing, templates, docs
	536: "components", // motion demo press spring
	523: "forms", // Button form and type passthrough
	492: "shell", // PageFrame mobile sheet
	402: "shell", // PageFrame
	401: "shell", // AppShellLayout stage
	387: "shell", // AuthLayout panel
	510: "components", // KpiCard chart slot
	390: "theme", // presets own the primary button and field roles
	404: "components", // LocaleSwitcher
	397: "components", // Stat
	418: "a11y", // touch targets fused in a selector list
	393: "shell", // Kanban
	368: "components", // GlassCard header
	369: "shell", // AuthLayout brand
	366: "shell", // PageShell actions
	452: "components", // ButtonGroup
	450: "forms", // InputGroup
	422: "components", // Badge, Button
	421: "theme", // component tokens
	389: "components", // Button tone
	395: "components", // Progress size
	453: "components", // Image ratio, AspectRatio
	451: "components", // Carousel
	449: "shell", // ResizablePanels
	487: "components", // Stat trend tone
	608: "overlays",
};

export function areaOf(kind: ChangeKind, title: string, files: string[] = [], pr?: number): AreaId {
	const forced = pr === undefined ? undefined : AREA_OVERRIDES[pr];
	if (forced) return forced;
	for (const [area, re] of TITLE_RULES) if (re.test(title)) return area;
	for (const [area, re] of PATH_RULES) if (files.some((f) => re.test(f))) return area;
	return kind === "test" ? "tests" : "components";
}
