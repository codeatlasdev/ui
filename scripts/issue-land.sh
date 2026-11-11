#!/usr/bin/env sh
# Land an issue PR: rebase its worktree on origin/main, regenerate generated files, run the short local
# check (validate + the tests the diff affects), push, and hand the PR to the merge queue (#822): CI is the gate,
# and the queue tests queued PRs together, so two PRs that pass alone cannot break main. Waits for the merge, cleans up.
#   sh scripts/issue-land.sh <issue-number>
set -e
N="$1"
[ -n "$N" ] || { echo "usage: issue-land.sh <issue>" >&2; exit 1; }
ROOT=$(cd "$(dirname "$0")/.." && pwd)
WT=$(git -C "$ROOT" worktree list --porcelain | awk -v n="$N" '/^worktree /{p=$2} /^branch refs\/heads\/(fix|feat)\//{ if ($2 ~ "/" n "-") print p }')
[ -n "$WT" ] || { echo "no worktree for #$N" >&2; exit 1; }
cd "$WT"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR=$(gh pr list --head "$BRANCH" --json number -q '.[0].number')
echo "== #$N  PR #$PR  $BRANCH"

. "$ROOT/scripts/generated-paths.sh"
git fetch -q origin main
# Leftovers from an earlier attempt: generated files are rebuilt below, anything else stops here.
for f in $(git status --porcelain --untracked-files=no | awk '{print $2}'); do
	if is_generated "$f"; then git checkout -- "$f"; fi
done
[ -z "$(git status --porcelain --untracked-files=no)" ] || { git status --short; echo "uncommitted changes in $WT" >&2; exit 1; }
if ! git rebase -q origin/main; then
	# Generated files conflict by construction: take main's and regenerate below.
	for f in $(git diff --name-only --diff-filter=U); do
		if is_generated "$f"; then
			git checkout --theirs -- "$f" 2>/dev/null || git checkout --ours -- "$f"
			git add "$f"
		else
			echo "manual conflict: $f" >&2
		fi
	done
	[ -z "$(git diff --name-only --diff-filter=U)" ] || { echo "resolve the conflicts above in $WT, then rerun" >&2; exit 1; }
	GIT_EDITOR=true git rebase --continue
fi
# A rebase can change bun.lock: plain install (not frozen), then restore the TypeScript link
# svelte-package needs (an install can drop it).
bun install >/dev/null && node scripts/fix-ts-symlink.js >/dev/null
# Only generated files: never sweep stray worktree files into the commit. Untracked ones count: a new
# demo makes the manifest create its site/public/api/v1 files for the first time (#589).
bun run --cwd packages/ui manifest -- --skill >/dev/null
for f in $(git status --porcelain --untracked-files=all | awk '{print $2}'); do
	if is_generated "$f"; then git add -- "$f"; fi
done
git diff --cached --quiet || git commit -qm "chore: regenerate lockfile and manifest after rebase"
[ -z "$(git status --porcelain --untracked-files=no)" ] || { git status --short; echo "uncommitted changes in $WT" >&2; exit 1; }
# The gate (#859): `validate` (it marks the tree, so the pre-push hook below does not run it again) and the unit,
# component and screenshot tests the diff affects (`bun run test`; it never builds the site). The site build,
# the route sweep and every browser suite run on CI in the merge queue. A screenshot mismatch means the change moved
# pixels: run `bun run test:vrt:update` in $WT, review the images, commit them and rerun this script.
# `bun scripts/test-changed.ts --land` is still the offline gate when CI is unavailable.
bun run validate
# A shared file (tokens, styles, theme, primitives, a test setup file) widens this to every component test: with
# no CI before the merge (#859), that local run is the gate for a shared change. Each component test gets one retry
# (#861): on ~2,300 browser tests a loaded laptop fails a different timing test on most passes, and a real regression
# fails twice.
# A test that passed only on its retry is listed after the run (#863): each one needs an issue and a fix.
RUNLOG=$(mktemp)
# `tee` would hide the run's exit code from `set -e`: keep it beside the log.
{ set +e; sh scripts/test-changed.sh --retry=1 2>&1; echo $? > "$RUNLOG.code"; } | tee "$RUNLOG"
CODE=$(cat "$RUNLOG.code")
FLAKY=$(grep -E '\(retry x[0-9]+\)' "$RUNLOG" | grep -v ' × ' | sed 's/^ *//' | sort -u)
if [ -n "$FLAKY" ]; then
	printf 'passed only on retry (open an issue for each):\n%s\n' "$FLAKY" >&2
fi
rm -f "$RUNLOG" "$RUNLOG.code"
[ "$CODE" = 0 ] || exit "$CODE"
git push -q --force-with-lease
gh pr ready "$PR" >/dev/null 2>&1 || true
# No --delete-branch: gh would switch this worktree to main (checked out in $ROOT) and delete the
# local branch (checked out here), failing after the merge (#103). `issue.ts done` removes both.
# GitHub deletes the remote branch on merge (repo setting); the API call covers it being turned off.
# Merged at once (#859): the gate is the local one above, on a tree rebased onto the latest main. The full suites run
# on main after the merge (ci.yml, push); a red main is fixed forward.
gh pr merge "$PR" --squash >/dev/null
gh api -X DELETE "repos/{owner}/{repo}/git/refs/heads/$BRANCH" >/dev/null 2>&1 || true
cd "$ROOT" && git fetch -q origin main && bun scripts/issue.ts done "$N"
echo "#$N landed"
