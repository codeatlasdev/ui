import { API_PATHS, apiUrl, SITE } from "../../../../../packages/ui/src/cli/agent-guide";

/** The real machine-readable endpoints: a guessed URL under /api/v1/ is a 404, this lists what exists. (`index.json` itself is the generated gallery index, #570.) */
export const GET = () =>
	new Response(
		JSON.stringify(
			{
				entry: `${SITE}/llms.txt`,
				endpoints: {
					"llms.txt": `${SITE}/llms.txt`,
					"llms-full.txt": `${SITE}/llms-full.txt`,
					"prompt.txt": `${SITE}/prompt.txt`,
					"gallery index (json)": apiUrl(API_PATHS.index),
					"demo catalog (json)": apiUrl(API_PATHS.catalog),
					"demo catalog (tsv)": apiUrl(API_PATHS.catalogTsv),
					"demo source (text)": apiUrl(API_PATHS.demoSource("{id}")),
					"docs search index": `${SITE}/search-index.json`,
				},
				note: "Component props are not served over HTTP: use the ca-ui-mcp server or node_modules/@codeatlasdev/ui/dist/components.json of the installed version.",
			},
			null,
			"\t"
		),
		{ headers: { "content-type": "application/json; charset=utf-8" } }
	);
