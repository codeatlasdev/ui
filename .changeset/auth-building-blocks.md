---
"@codeatlasdev/ui": minor
---

Auth building blocks (#379): `Turnstile` in `@codeatlasdev/ui/forms` (Cloudflare captcha, explicit render, loads the vendor script on demand with no dependency and no server access, follows the colour scheme and the locale, `bind:handle` with `getToken()` / `reset()`, removed on unmount, silent no-op without a `siteKey`), `PasswordStrength` (3-step meter with a polite text label, pure `passwordScore()` and a `score` / `labels` override), `SplashScreen` (`role="status"`, `ready` + `minDuration`, skipped under reduced motion) and `Avatar` `decorative` (no accessible name next to a visible name). New i18n groups `passwordStrength`, `splashScreen` and `turnstile` (en, pt-BR).
