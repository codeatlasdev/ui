// Stand-in for SvelteKit's `$app/state` so Vite can resolve kit modules in component tests.
// Tests that exercise navigation replace it with `vi.mock("$app/state", ...)`.
export const navigating: { from: unknown; to: unknown; type: string | null } = {
	from: null,
	to: null,
	type: null,
};
export const page = { url: new URL("http://localhost/") };
