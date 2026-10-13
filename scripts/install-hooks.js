// Installs the lefthook pre-push gate for contributors. CI needs no git hooks (and its
// containers reject git operations on mounted checkouts), so it is skipped there.
import { execFileSync } from "node:child_process";

if (!process.env.CI) execFileSync("lefthook", ["install"], { stdio: "inherit" });
