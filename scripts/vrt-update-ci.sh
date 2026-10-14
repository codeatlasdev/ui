#!/usr/bin/env sh
# Regenerate visual baselines on CI (native linux/amd64, same image as the check) and pull them.
# Local Docker on Apple Silicon emulates amd64 and takes 10x longer; use test:vrt:update:local offline.
# Needs: gh (authenticated), the current branch pushed with no unpushed commits.
set -e
command -v gh >/dev/null 2>&1 || { echo "gh CLI is required (https://cli.github.com)." >&2; exit 1; }
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git fetch -q origin "$BRANCH" 2>/dev/null || { echo "Push $BRANCH first: CI regenerates baselines from the remote branch." >&2; exit 1; }
if [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH")" ]; then
	echo "HEAD differs from origin/$BRANCH: push (or pull) first so CI renders what you have." >&2
	exit 1
fi
STARTED=$(date -u +%Y-%m-%dT%H:%M:%SZ)
gh workflow run ci.yml --ref "$BRANCH" -f update-snapshots=true
echo "Dispatched CI on $BRANCH; waiting for the run to appear..."
RUN=""
for _ in $(seq 1 30); do
	RUN=$(gh run list --workflow ci.yml --branch "$BRANCH" --event workflow_dispatch --limit 1 \
		--json databaseId,createdAt -q ".[] | select(.createdAt >= \"$STARTED\") | .databaseId")
	[ -n "$RUN" ] && break
	sleep 4
done
[ -n "$RUN" ] || { echo "Run did not start; check: gh run list --workflow ci.yml" >&2; exit 1; }
gh run watch "$RUN" --interval 20 --exit-status
git pull --ff-only -q origin "$BRANCH"
echo "Baselines updated from CI run $RUN:"
git log -3 --format='  %h %s' -- '**/__screenshots__/**'
