/** Minimal unified diff (LCS over lines) for showing a proposed change to an existing file. */
export function unifiedDiff(path: string, before: string, after: string): string {
	const a = before.split("\n");
	const b = after.split("\n");
	// lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..]
	const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
	for (let i = a.length - 1; i >= 0; i--)
		for (let j = b.length - 1; j >= 0; j--)
			lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

	const ops: string[] = [];
	let i = 0;
	let j = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			ops.push(` ${a[i++]}`);
			j++;
		} else if (lcs[i + 1][j] >= lcs[i][j + 1]) ops.push(`-${a[i++]}`);
		else ops.push(`+${b[j++]}`);
	}
	while (i < a.length) ops.push(`-${a[i++]}`);
	while (j < b.length) ops.push(`+${b[j++]}`);

	// Keep 2 lines of context around each change.
	const keep = ops.map(
		(o, k) =>
			!o.startsWith(" ") || ops.slice(Math.max(0, k - 2), k + 3).some((x) => !x.startsWith(" "))
	);
	const out = [`--- a/${path}`, `+++ b/${path}`];
	let skipped = false;
	ops.forEach((o, k) => {
		if (!keep[k]) {
			skipped = true;
			return;
		}
		if (skipped) out.push("@@");
		skipped = false;
		out.push(o);
	});
	return out.join("\n");
}
