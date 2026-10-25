import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { GROUPS } from "./lib/nav";

const highlight = z.object({
	/** Anchor id of the section in the body (`<Section id>` in the MDX) and of the TOC entry. */
	id: z.string().regex(/^[a-z0-9-]+$/),
	title: z.string(),
	/** One sentence: the index card and the TL;DR show it. */
	summary: z.string(),
});

const headlineNumber = z.object({
	value: z.string(),
	label: z.string(),
	/** Conditions the number was taken under, or where it is recorded. Required: a number with no conditions is not shipped. */
	note: z.string().min(12),
});

const behaviour = z.object({
	title: z.string(),
	/** What changes for an app that did nothing about it. */
	body: z.string(),
	/** What to do, or "nothing". */
	fix: z.string(),
});

export const collections = {
	docs: defineCollection({
		loader: glob({ pattern: "**/*.mdx", base: "./src/content/docs" }),
		schema: z.object({
			title: z.string(),
			description: z.string(),
			group: z.enum(GROUPS),
			/** Position inside the group; pages without it sort by title after ordered ones. */
			order: z.number().optional(),
		}),
	}),
	/** One long-form post per release: `<version>.mdx` (the id is the version, so the URL is `/changelog/<version>/`). */
	changelog: defineCollection({
		loader: glob({ pattern: "*.mdx", base: "./src/content/changelog" }),
		schema: z.object({
			version: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/),
			/** ISO date the post is dated. */
			date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
			headline: z.string(),
			lede: z.string(),
			/** Scene id of the hero illustration: a key of `components/changelog/scenes/index.ts`. */
			hero: z.string(),
			highlights: z.array(highlight).min(1),
			headlineNumbers: z.array(headlineNumber).default([]),
			/** Observable behaviour changes (there is no breaking change in a minor, so this is the honest list of what moves). */
			behaviour: z.array(behaviour).default([]),
			/** Description for the page and its social card. */
			description: z.string(),
		}),
	}),
};
