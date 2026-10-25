// Content of the Prompt and Anatomy tabs of /gallery/<id>/, built from the catalog record and the index entry.
// Pure: the viewer renders it, the tests read it.
import type { IndexEntry } from "../../../packages/ui/scripts/index-build";

/** The fields of a catalog element the tabs read. */
export interface ItemRecord {
	id: string;
	title: string;
	group: string;
	page: string;
	use: string;
	spec: string[];
	components: string[];
	imports: { from: string; names: string[] }[];
	motion?: {
		property: string;
		duration: string;
		easing: string;
		delay?: string;
		stagger?: string;
		spring?: string;
	}[];
	needs: string;
}

/** One line of timing, in the words an AI can apply without guessing. */
export function beat(m: NonNullable<ItemRecord["motion"]>[number]): string {
	const parts = [`${m.property}: ${m.duration}`, m.easing];
	if (m.delay) parts.push(`delay ${m.delay}`);
	if (m.stagger) parts.push(`stagger ${m.stagger}`);
	if (m.spring) parts.push(`spring ${m.spring}`);
	return parts.join(", ");
}

/**
 * The prompt to hand an AI so it builds this item with the library: what to fetch, which components and exact timings
 * to keep, what the item is for and what it promises about reduced motion and keyboard.
 */
export function buildPrompt(item: ItemRecord, entry?: IndexEntry): string {
	const a11y = entry?.a11y;
	const lines = [
		`Build the "${item.title}" pattern (@codeatlasdev/ui demo #${item.id}, ${item.group}/${item.page}) in my app.`,
		"",
		`Call get_demo({ ids: ["#${item.id}"] }) first and keep its structure. It needs ${item.needs}.`,
		`Use: ${item.use}`,
		"",
		"Keep these library parts, with the props and tokens the demo uses:",
		...item.imports.map((i) => `- ${i.names.join(", ")} from "${i.from}"`),
	];
	if (item.spec.length) lines.push("", "Behaviour to keep:", ...item.spec.map((s) => `- ${s}`));
	if (item.motion?.length)
		lines.push("", "Exact motion (do not approximate):", ...item.motion.map((m) => `- ${beat(m)}`));
	if (a11y) {
		lines.push(
			"",
			`Reduced motion: ${a11y.reducedMotion ? "the demo handles it; keep that branch" : "not applicable, nothing animates on its own"}.`,
			`Keyboard: ${a11y.keyboard ? "operable; keep the focus order and key handling" : "not an interactive control"}.`
		);
	}
	lines.push(
		"",
		"Change only the copy and the data. Use the theme tokens (--ca-*), never raw colours."
	);
	return lines.join("\n");
}

export interface AnatomyPart {
	name: string;
	from: string;
	/** Docs page, only when a page of that exact name exists. */
	href?: string;
}

/** Components used by the item with the package each is imported from and a docs link when one exists. */
export function buildAnatomy(
	item: ItemRecord,
	docSlugs: ReadonlyMap<string, string>
): AnatomyPart[] {
	const from = new Map(item.imports.flatMap((i) => i.names.map((n) => [n, i.from] as const)));
	return item.components.map((name) => {
		const slug = docSlugs.get(name.replace(/(?<!^)([A-Z])/g, "-$1").toLowerCase());
		return {
			name,
			from: from.get(name) ?? "@codeatlasdev/ui",
			href: slug ? `/docs/${slug}/` : undefined,
		};
	});
}
