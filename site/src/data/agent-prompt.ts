// The one prompt of the landing hero. Single source for the hero box and /prompt.txt (agents can
// fetch it directly). Every tool and command named here must exist in the package.
export const AGENT_PROMPT = `Use CodeAtlas UI (@codeatlasdev/ui, Svelte 5) for all UI in this project.

1. Connect to the library. Add the MCP server: npx -y -p @codeatlasdev/ui ca-ui-mcp
   (Claude Code: /plugin install codeatlas-ui --marketplace codeatlasdev/ui). Then run: npx skills add codeatlasdev/ui

2. Look at what I have:
   - No project yet: run bunx @codeatlasdev/ui init --write in a new SvelteKit or Astro app.
   - Svelte app already here: run bunx @codeatlasdev/ui init --write in place.
   - React app: call get_guide with "migrate-react" and follow it.

3. Build from references. Call search_demos to find a numbered demo, then get_demo to read it. Keep its components, props and motion; change only data, copy and theme. Use get_component before using any prop you are not sure about.

4. If the library blocks you: write a workaround in my code marked "// ca-ui-workaround(#<issue>): <why>", then call report_issue with a minimal repro. Use neutral names only: no project, company, file paths, URLs, secrets or data.

5. Show me one real screen at desktop and phone width when done.`;
