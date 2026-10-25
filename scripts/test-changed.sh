#!/bin/sh
# `bun run test` / `test:changed`: the budget follows the selection's scope. A narrow selection keeps the 60 s
# `changed` budget; one widened to every component test (a shared file, a test-runtime dependency like happy-dom)
# runs under `landShared`, and test-changed.ts says why. The budget is read before the clock starts.
#   sh scripts/test-changed.sh [test-changed args]
set -e
cd "$(dirname "$0")/.."
BUDGET=$(bun scripts/test-changed.ts --print-budget "$@")
exec bun scripts/test-run.ts --budget="$BUDGET" bun scripts/test-changed.ts "$@"
