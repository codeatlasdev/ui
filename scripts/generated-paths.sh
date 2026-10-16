# Files rebuilt by `bun install` / `bun run --cwd packages/ui manifest -- --skill`: a rebase takes
# either side and the land regenerates them. Hand-written files (docs/css-api.md, the demo id list
# in site/src/demos/catalog.ts) are never here: their conflicts are resolved by a person.
is_generated() {
	case "$1" in
	bun.lock | */API.md | */DEMOS.md | */components.json | site/public/api/v1/*) return 0 ;;
	esac
	return 1
}
