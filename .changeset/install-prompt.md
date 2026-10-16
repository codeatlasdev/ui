---
"@codeatlasdev/ui": minor
---

New `InstallPrompt` (#208): a dismissible banner that offers to install the app. On Chromium it keeps `beforeinstallprompt` (no browser mini-infobar) and shows an Install button that opens the native dialog and reports the choice with `onchoice`; on iOS Safari and iPadOS, which have no install API, it shows the Share, Add to Home Screen steps. It renders nothing when the app already runs standalone, and stays hidden for `dismissDays` (default 14) after the user closes it. Strings are in the `installPrompt` i18n group (`en`, `pt-BR`); the `root: Button only` size budget rises by 240 B gzip because both catalogs ship with every root import.
