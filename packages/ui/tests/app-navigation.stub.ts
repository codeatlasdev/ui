// Stand-in for SvelteKit's `$app/navigation` so Vite can resolve kit modules in component tests.
// Tests that exercise navigation replace it with `vi.mock("$app/navigation", ...)`.
export function afterNavigate(_callback: (navigation: { type: string }) => void): void {}
