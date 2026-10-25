import { createHash, randomUUID } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	renameSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

/**
 * Rendered social cards survive `dist` being emptied by the next build. A card is a pure function of its HTML
 * (title, description, eyebrow, mark, colors and the template's own CSS are all in it) and of the Chromium that
 * rasterised it, so `sha256(browser version + html)` names the cached PNG: an edit to the template, a copy change
 * or a browser update misses the cache and renders again. The land gate builds the site after every rebase and
 * used to pay 63 s for 880 renders that had not changed; a release build and a fresh checkout start cold.
 */
export const cardKey = (browserVersion: string, html: string) =>
	createHash("sha256").update(browserVersion).update("\0").update(html).digest("hex");

/** Puts the card for `html` at `target`, rendering it only when the cache has no PNG for it. Returns whether it hit. */
export async function placeCard(
	cacheDir: string,
	browserVersion: string,
	html: string,
	target: string,
	render: (html: string) => Promise<Uint8Array>
): Promise<boolean> {
	const cached = join(cacheDir, `${cardKey(browserVersion, html)}.png`);
	const hit = existsSync(cached);
	if (hit) {
		// "used" is what pruning goes by, not "made"
		const now = new Date();
		utimesSync(cached, now, now);
	} else {
		mkdirSync(cacheDir, { recursive: true });
		// rename is atomic: a build killed mid-write never leaves a truncated PNG that later builds would trust; the
		// name is unique per call so two renders of the same card at once cannot interleave
		const partial = `${cached}.${process.pid}.${randomUUID()}.tmp`;
		writeFileSync(partial, await render(html));
		renameSync(partial, cached);
	}
	mkdirSync(dirname(target), { recursive: true });
	copyFileSync(cached, target);
	return hit;
}
