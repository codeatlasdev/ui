// Reactive stand-in for `navigating` from `$app/state` (test only).
export const proxyState: { from: unknown; to: unknown; type: string | null } = $state({
	from: null,
	to: null,
	type: null,
});
