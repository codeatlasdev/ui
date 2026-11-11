#!/bin/sh
# `bun run test` / `test:changed`: the budget follows the selection's scope. A narrow selection keeps the 60 s
# `changed` budget; one widened to every component test (a shared file, a test-runtime dependency like happy-dom)
# runs under `landShared`, and test-changed.ts says why. The budget is read before the clock starts.
#   sh scripts/test-changed.sh [test-changed args]
set -e
cd "$(dirname "$0")/.."
# CA_TEST_BUDGET overrides the choice: a land (scripts/issue-land.sh) gates on the result, not on the 60 s a day-to-day
# run promises, because a change to a component used everywhere (Button) legitimately selects many tests (#881).
BUDGET=${CA_TEST_BUDGET:-$(bun scripts/test-changed.ts --print-budget "$@")}
exec bun scripts/test-run.ts --budget="$BUDGET" bun scripts/test-changed.ts "$@"
