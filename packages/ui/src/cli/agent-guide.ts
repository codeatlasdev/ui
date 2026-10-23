// What `codeatlas-ui init` writes into an app's AGENTS.md, and the pages it points at. Kept inside
// src/cli so the CLI stays self-contained; scripts/ai-entry.ts re-exports it for the site and MCP.
export const SITE = "https://ui.codeatlas.com.br";

/** Docs pages an agent opens first, in this order. The slugs are checked against the real pages by a test. */
export const ENTRY_PAGES = {
	recipes: "getting-started/recipes",
	choosing: "getting-started/choosing",
	workarounds: "getting-started/workarounds",
	install: "getting-started/installation",
	aiAgents: "getting-started/ai-agents",
	reporting: "getting-started/reporting",
} as const;

/**
 * What an agent working in an app that consumes the package must know. Appended to llms-full.txt and
 * written by `codeatlas-ui init` into the app's AGENTS.md (between the markers below), so the next agent
 * that opens the project starts from the same rules. Contributor rules stay in the repo AGENTS.md.
 */
export const CONSUMER_GUIDE = `# Using @codeatlasdev/ui in this app

Docs entry point for agents: ${SITE}/llms.txt (recipes for app shell, list, form, settings, auth, landing, dashboard and theming; decision tables; common workarounds).

1. Find the screen type in the recipes and copy it whole; change only data, copy and theme.
2. Before writing CSS, a wrapper, a \`setTimeout\` or a local copy of a component, check ${SITE}/docs/${ENTRY_PAGES.choosing}/ and ${SITE}/docs/${ENTRY_PAGES.workarounds}/.
3. Never guess a prop. Ask the \`ca-ui-mcp\` MCP server (\`get_component\`, \`get_recipe\`, \`search_demos\`) or read \`node_modules/@codeatlasdev/ui/dist/components.json\`. The installed version outranks every page and skill.
4. Pages are \`AppList\`, \`AppForm\`, \`AppSettings\`, \`PageShell\`, \`AuthLayout\`; \`AppShellLayout\` goes only in the layout of an authenticated route group, never in the root layout.
5. Layout is \`Flex\`, \`Stack\`, \`Grid\` with a spacing step (\`gap="4"\`, \`columns={3}\`). No layout CSS, no inline padding or margin, no raw colors: use \`--ca-*\` tokens. \`Row\`, \`GlassCard\` and \`GlassSurface\` are deprecated (\`Flex\`, \`Card\`, \`Surface\`; \`bunx @codeatlasdev/ui migrate --write\`).
6. Svelte 5 runes only. Import from \`@codeatlasdev/ui\`; charts, DataTable and CodeSnippet come from the \`/charts\`, \`/table\` and \`/code\` subpaths.
7. One \`ThemeOptions\` object in \`src/lib/theme.ts\`, passed to the Vite plugin and the server hook (\`bunx @codeatlasdev/ui init --write\`). Override tokens by declaring \`--ca-*\` on \`:root\`.
8. Mobile: heights use \`var(--ca-vh)\`, never \`100vh\`; the 44px touch target is global.
9. If the library blocks you: write \`// ca-ui-workaround(#<issue>): <why>\` and call \`report_issue\` with neutral names only.
`;

/** Markers around the block \`init\` owns in the app's AGENTS.md: rerunning replaces what is between them. */
export const GUIDE_START = "<!-- codeatlas-ui:start -->";
export const GUIDE_END = "<!-- codeatlas-ui:end -->";
