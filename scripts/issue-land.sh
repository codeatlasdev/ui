#!/usr/bin/env sh
# Land an issue PR: rebase its worktree on origin/main, regenerate generated files, validate,
# regenerate visual baselines on CI, mark ready, wait for green checks, squash-merge, clean up.
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

git fetch -q origin main
# Leftovers from an earlier attempt: generated files are rebuilt below, anything else stops here.
for f in $(git status --porcelain --untracked-files=no | awk '{print $2}'); do
	case "$f" in bun.lock | */API.md | */components.json | docs/css-api.md) git checkout -- "$f" ;; esac
done
[ -z "$(git status --porcelain --untracked-files=no)" ] || { git status --short; echo "uncommitted changes in $WT" >&2; exit 1; }
if ! git rebase -q origin/main; then
	# Generated files conflict by construction: take main's and regenerate below.
	for f in $(git diff --name-only --diff-filter=U); do
		case "$f" in
		*/API.md | */components.json | docs/css-api.md | bun.lock) git checkout --theirs -- "$f" 2>/dev/null || git checkout --ours -- "$f"; git add "$f" ;;
		*) echo "manual conflict: $f" >&2 ;;
		esac
	done
	[ -z "$(git diff --name-only --diff-filter=U)" ] || { echo "resolve the conflicts above in $WT, then rerun" >&2; exit 1; }
	GIT_EDITOR=true git rebase --continue
fi
# A rebase can change bun.lock: plain install (not frozen), then restore the TypeScript link
# svelte-package needs (an install can drop it).
bun install >/dev/null && node scripts/fix-ts-symlink.js >/dev/null
# Only generated files: never sweep stray worktree files into the commit.
bun run --cwd packages/ui manifest -- --skill >/dev/null 2>&1 || true
for f in $(git status --porcelain --untracked-files=no | awk '{print $2}'); do
	case "$f" in bun.lock | */API.md | */components.json | docs/css-api.md) git add -- "$f" ;; esac
done
git diff --cached --quiet || git commit -qm "chore: regenerate lockfile and manifest after rebase"
[ -z "$(git status --porcelain --untracked-files=no)" ] || { git status --short; echo "uncommitted changes in $WT" >&2; exit 1; }
bun run validate
git push -q --force-with-lease
gh pr ready "$PR" >/dev/null 2>&1 || true
# CI paused (ci.yml disabled, see AGENTS.md): the validate above is the gate, and baselines can only
# be rendered on CI, so both CI steps are skipped until `gh workflow enable ci.yml`.
if [ "$(gh api "repos/{owner}/{repo}/actions/workflows/ci.yml" -q .state 2>/dev/null)" = "active" ]; then
	sh "$ROOT/scripts/vrt-update-ci.sh"
	# The bot's baseline commit does not trigger CI: push an empty commit to run checks on the final head.
	git commit -q --allow-empty -m "ci: run checks on final head" && git push -q
	# Merge gate: checks reported for this exact head, none pending, all passed (scripts/pr-gate.ts).
	bun "$ROOT/scripts/pr-gate.ts" "$PR" "$(git rev-parse HEAD)"
else
	echo "CI paused: validate is the gate; visual baselines not regenerated"
fi
# No --delete-branch: gh would switch this worktree to main (checked out in $ROOT) and delete the
# local branch (checked out here), failing after the merge (#103). `issue.ts done` removes both.
# GitHub deletes the remote branch on merge (repo setting); the API call covers it being turned off.
gh pr merge "$PR" --squash >/dev/null
gh api -X DELETE "repos/{owner}/{repo}/git/refs/heads/$BRANCH" >/dev/null 2>&1 || true
cd "$ROOT" && git fetch -q origin main && bun scripts/issue.ts done "$N"
echo "#$N landed"
