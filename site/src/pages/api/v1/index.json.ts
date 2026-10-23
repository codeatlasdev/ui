const SITE = "https://ui.codeatlas.com.br";

/** The real machine-readable endpoints: a guessed URL under /api/v1/ is a 404, this lists what exists. */
export const GET = () =>
	new Response(
		JSON.stringify(
			{
				entry: `${SITE}/llms.txt`,
				endpoints: {
					"llms.txt": `${SITE}/llms.txt`,
					"llms-full.txt": `${SITE}/llms-full.txt`,
					"prompt.txt": `${SITE}/prompt.txt`,
					"demo catalog (json)": `${SITE}/api/v1/catalog.json`,
					"demo catalog (tsv)": `${SITE}/api/v1/en/catalog.tsv`,
					"demo source (text)": `${SITE}/api/v1/en/e/{id}.txt`,
					"docs search index": `${SITE}/search-index.json`,
				},
				note: "Component props are not served over HTTP: use the ca-ui-mcp server or node_modules/@codeatlasdev/ui/dist/components.json of the installed version.",
			},
			null,
			"\t"
		),
		{ headers: { "content-type": "application/json; charset=utf-8" } }
	);
