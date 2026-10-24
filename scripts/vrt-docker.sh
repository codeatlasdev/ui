#!/usr/bin/env sh
# Render or check the visual baselines locally, in the same environment CI used (linux/amd64,
# Playwright image `noble`), so the pixels match. CI is paused: this is the only way to produce them.
#   sh scripts/vrt-docker.sh --update   regenerate every baseline (package + site)
#   sh scripts/vrt-docker.sh --check    compare against the committed baselines (default)
# Runs the steps of the `visual` job in .github/workflows/ci.yml: build the package and the site, then
# `test:vrt` (Vitest, packages/ui) and the site's visual-desktop/visual-mobile projects (Playwright).
# The worktree is bind-mounted; node_modules, build output and caches live in container-local volumes
# so the host's macOS node_modules is never seen (nor written). Needs Docker. Baselines land in the
# worktree under `__screenshots__/`; failure diffs under site/test-results and packages/ui/.vitest.
set -e
MODE=check
case "${1:-}" in
	--update) MODE=update ;;
	--check | "") MODE=check ;;
	*) echo "usage: vrt-docker.sh [--update|--check]" >&2; exit 1 ;;
esac
command -v docker >/dev/null 2>&1 || { echo "Docker is required (https://docs.docker.com/get-docker/)." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "The Docker daemon is not running." >&2; exit 1; }

ROOT=$(cd "$(dirname "$0")/.." && pwd)
# The image must match the installed browser build: site/package.json pins @playwright/test (the
# only place the version lives, same as .github/actions/setup).
PW=$(sed -n 's/.*"@playwright\/test": *"\([0-9][0-9.]*\)".*/\1/p' "$ROOT/site/package.json")
[ -n "$PW" ] || { echo "Cannot read the @playwright/test version from site/package.json." >&2; exit 1; }
IMAGE="mcr.microsoft.com/playwright:v$PW-noble"
BUN=$(sed -n 's/.*"packageManager": *"bun@\([0-9][0-9.]*\)".*/\1/p' "$ROOT/package.json")
[ -n "$BUN" ] || { echo "Cannot read the bun version from package.json." >&2; exit 1; }

# One set of volumes per worktree path, so parallel worktrees never share an install.
KEY=$(printf %s "$ROOT" | cksum | cut -d' ' -f1)
VOL="ca-vrt-$KEY"

if [ "$MODE" = update ]; then
	PKG_ARGS="--update"
	SITE_ARGS="--update-snapshots"
else
	PKG_ARGS=""
	SITE_ARGS=""
fi
# CI runs on 4 native vCPUs; under amd64 emulation (Apple Silicon) more workers only starve each other
# into the 5s screenshot timeout. Override with VRT_WORKERS.
WORKERS="${VRT_WORKERS:-4}"

# Everything below runs inside the container (single quotes: expanded there, not here).
INNER='
set -e
export CI=1 E2E_PREBUILT=1 HOME=/root
# Build output is written into the worktree (gitignored, same paths as a host build) and removed on exit,
# so a Linux build never lingers next to a macOS one.
OUT="/work/packages/ui/dist /work/site/dist /work/site/.astro /work/packages/ui/.svelte-kit"
trap "rm -rf $OUT" EXIT
rm -rf $OUT
# Match the fonts of the ubuntu-24.04 runner that rendered the committed baselines. The Playwright image
# differs in two ways: it has no DejaVu (so `system-ui`, `sans-serif`, `serif` and `monospace` fall back to
# WenQuanYi/Liberation, while the runner resolves them to DejaVu), and it ships FreeFont, whose FreeMono
# wins a language-less `monospace` lookup while a language-tagged one gives DejaVu Sans Mono. Chromium uses
# both lookups, so code blocks changed height by ~27px after the first full-page capture and no screenshot
# was ever stable. DejaVu in, FreeFont out gives one answer for every lookup.
apt-get update -qq >/dev/null
apt-get install -y -qq fonts-dejavu-core >/dev/null
apt-get remove -y -qq fonts-freefont-ttf >/dev/null
fc-cache -f
# node_modules are volumes: copy nothing from the host, install from the lockfile like CI does.
npm install -g "bun@$BUN" >/dev/null
bun install --frozen-lockfile --ignore-scripts
node scripts/fix-ts-symlink.js
# `validate` builds the package first (phase 0); the visual job downloads the `build` artifact instead.
bun run --cwd packages/ui build
bun run --cwd site build
# The two suites are independent jobs in CI (matrix): run both, so one failing never hides the other.
rc=0
bun run --cwd packages/ui test:vrt $PKG_ARGS || rc=1
(cd site && bunx playwright test --project=visual-desktop --project=visual-mobile --workers="$WORKERS" $SITE_ARGS) || rc=1
exit $rc
'

echo "vrt-docker: $MODE with $IMAGE (linux/amd64, volumes $VOL-*)"
# The bind mount's node_modules directories (root, package, site) are shadowed by volumes.
exec docker run --rm --platform linux/amd64 --ipc=host \
	-e BUN="$BUN" -e PKG_ARGS="$PKG_ARGS" -e SITE_ARGS="$SITE_ARGS" -e WORKERS="$WORKERS" \
	-v "$ROOT:/work" -w /work \
	-v "$VOL-nm:/work/node_modules" \
	-v "$VOL-nm-ui:/work/packages/ui/node_modules" \
	-v "$VOL-nm-site:/work/site/node_modules" \
	-v "$VOL-bun:/root/.bun" \
	"$IMAGE" sh -c "$INNER"
