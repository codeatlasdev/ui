import type { FullConfig } from "@playwright/test";

/**
 * The server answering on the base URL must be THIS site. A different project's dev server on the same
 * port once served its own pages to this suite, whose screenshots were then committed as the baselines of
 * this one. The home page names the product in its `<title>`; anything else stops the run before a test.
 */
export default async function globalSetup(config: FullConfig) {
	const baseURL = config.projects[0]?.use.baseURL ?? "";
	const res = await fetch(`${baseURL}/`);
	const title = (await res.text()).match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
	if (!/CodeAtlas/i.test(title))
		throw new Error(
			`${baseURL} is not the CodeAtlas UI site (its <title> is "${title}"): another project is using this port. Set E2E_PORT to a free one.`
		);
}
