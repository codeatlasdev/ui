import { robotsTxt } from "@codeatlasdev/ui/seo";

export function GET() {
	return new Response(robotsTxt({ sitemap: "https://ui.codeatlas.com.br/sitemap-index.xml" }), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
