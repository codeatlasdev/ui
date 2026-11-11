# ADR 0003: Contrast and comfort guaranteed by the theme, not by the consumer

Status: proposed (2026-11-10)

## Context

Trigger, R2K backoffice (preset `r2k`, brand `#00afea`):

- the outbound chat bubble filled a large area with saturated `#00afea` and put dark text on it;
- cards had heavy outlines (`border` + `borderStrong`) on top of surface steps that already separate them;
- spacing felt cramped (dense padding inside bubbles and cards, short gaps between groups).

Each pair *passed* WCAG 2.x, which is exactly the problem: the ratio says nothing about the
area of a saturated fill, polarity, or visual noise from outlines.

What the library already does (verified on `main`, 2026-11-10):

- `packages/ui/src/lib/theme/contrast.ts` → `presetContrastIssues()` checks hand-set `brandContrast`
  on `brandFill` and `text|textSecondary|textHint` on the four surfaces (alpha composited) at
  WCAG 4.5:1. It only **warns** (`warnPresetContrast`) from `caThemePlugin`/`caUI`; it never fails.
- `utils/palette-generator.ts` already works in OKLCH (`hexToOklch`, `generatePreset`, `lift()`
  to AA + margin, `onFill()` choosing white or ink for the error fill).
- Fixed regressions show the gap is systemic, one pair at a time: #22, #410, #440, #472, #718,
  #749 (white `--ca-on-semantic` at 1.54–2.25:1 in dark), #706, #675 (subtle status surfaces),
  #708 (disabled look), #748 (AudioPlayer on a brand-filled MessageBubble), #19, #23.

Not covered: semantic/badge/chip/bubble/selected/focus pairs as a matrix, APCA, dark-mode
polarity, non-text contrast (WCAG 1.4.11), colour-vision deficiency, fill area, separation
(border vs tone) and spacing.

### R2K numbers (computed 2026-11-10, WCAG 2.2 relative luminance and APCA-W3 0.0.98G)

| Text on background | WCAG 2.x | APCA Lc | Reading |
|---|---|---|---|
| `#000000` on `#00afea` | **8.32:1** (AAA) | 55.2 | WCAG says "excellent"; APCA says large/bold text only |
| `#0f172a` on `#00afea` | 7.07:1 | 53.7 | same: fine for a label, tiring for paragraphs |
| `#ffffff` on `#00afea` | **2.52:1** (fails) | −53.8 | WCAG fails; APCA ≈ same as black: neither suits body text |
| `#ffffff` on `#0077a3` | 5.04:1 | −79.6 | passes both for body text |
| `#ffffff` on `#006a91` | 6.05:1 | −84.9 | comfortable body text |
| `#003549` on `#e0f5fd` (tonal container) | 11.62:1 | 90.8 | preferred for long text |

The task brief's "≈8.3:1 / ≈2.5:1" is confirmed. The point: `#00afea` is a mid-tone
(OKLCH L ≈ 0.68). **No** text colour reaches APCA Lc 75 on it, so it must not carry message text.

## Research (sources accessed 2026-11-10)

1. **WCAG 2.2 vs APCA.** WCAG 2.x uses a symmetric luminance ratio with 4.5:1 / 3:1 (large) and
   3:1 for non-text ([Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
   [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). It is polarity-blind
   and overstates contrast of dark text on mid-tones while understating white on saturated mid-tones
   (orange/cyan buttons). APCA is polarity-aware and size/weight-dependent: Lc 90 preferred / Lc 75
   minimum for body text, Lc 60 for other content text, Lc 45 for large/bold headings, Lc 30 for
   placeholder/disabled, Lc 15 for non-text ([APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell),
   [Bronze Simple Mode](https://readtech.org/ARC/tests/bronze-simple-mode?tn=conform)). APCA is in the
   WCAG 3 *working draft* only ([WCAG 3](https://www.w3.org/TR/wcag-3.0/)); it is not a legal standard.
   **Decision basis:** WCAG AA is the legal floor; APCA is the comfort target. Ship both.
   Where they disagree (mid-tone brand fills), treat the pair as label-only.
2. **Perceptual palettes.** OKLab/OKLCH ([Ottosson 2020](https://bottosson.github.io/posts/oklab/))
   give near-uniform lightness, so a tone scale can be built by stepping L at fixed hue and
   gamut-clamped chroma. Tailwind v4 ships its palette in OKLCH ([v4.0 post](https://tailwindcss.com/blog/tailwindcss-v4)).
   Material 3 HCT: "tone" is L*; a difference of ≥ 40 tones guarantees ≥ 3:1 and ≥ 50 guarantees
   ≥ 4.5:1, which is how dynamic colour makes `primary/onPrimary`, `primaryContainer/onPrimaryContainer`
   safe for any seed ([M3 color roles](https://m3.material.io/styles/color/roles),
   [Science of color](https://m3.material.io/blog/science-of-color-design)). Radix Colors defines 12
   steps with fixed jobs: 1–2 backgrounds, 3–5 component fills, 6–8 borders, 9–10 solid, 11–12 text,
   step 11 guaranteed Lc 60 and 12 Lc 90 on step 2 ([Radix: understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)).
   Adobe Leonardo generates colours *from a target contrast* rather than checking afterwards
   ([leonardocolor.io](https://leonardocolor.io/), [Adobe blog](https://blog.adobe.com/en/publish/2022/03/21/accessible-color-palettes-leonardo)).
   Apple HIG: prefer system/semantic colours, check in light, dark and Increase Contrast
   ([HIG Color](https://developer.apple.com/design/human-interface-guidelines/color)).
3. **On-colour selection.** Picking "black or white, whichever ratio is higher" (what `onFill` does)
   selects black on every mid-tone, the R2K failure. Better: (a) solve for a target (Leonardo /
   HCT tone distance), (b) when neither ink nor white reaches the body target, **move the fill**
   (darken in light, lift in dark) instead of the text, and keep the raw brand for small accents.
4. **Dark mode.** Avoid pure `#000` backgrounds and pure `#fff` body text: high-luminance text on
   black blooms (halation), worse with astigmatism, and OLED smear; desaturate brand colours in dark
   because saturated colours vibrate on dark surfaces; express elevation by lighter surfaces, not
   shadows ([Material dark theme](https://m2.material.io/design/color/dark-theme.html),
   [M3 elevation](https://m3.material.io/styles/elevation/overview)). WCAG 2 also overrates contrast of
   dark pairs, so APCA is the better dark-scheme check ([APCA Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell)).
5. **Large saturated areas.** Saturated mid-tone fills over large areas increase glare and
   after-images, and compete with content; systems reserve the solid/accent step for small, high-
   intent elements and use low-chroma "container" tones for areas (M3 `primaryContainer`, Radix
   steps 3–5). Evidence here is design-practice and vision-ergonomics, not controlled UI trials:
   treat the area/chroma limits below as heuristics with a lint, not as science.
6. **Colour psychology.** Solid: colour affects *perception and attention* (salience, red as
   alerting) but effects on behaviour are small, context-bound and often fail replication; the field
   itself flags weak methods ([Elliot & Maier 2014, Annu. Rev. Psychol. 65](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010213-115035),
   [Elliot 2015, Front. Psychol.](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00368/full)).
   Folklore: "blue = trust converts better", fixed emotion-per-hue charts. For travel/CRM the
   defensible guidance is: brand recognition (consistent hue), calm low-chroma surfaces for long
   work sessions, colour reserved for state and action. Do not use psychology claims to justify a
   token value; use contrast and task data.
7. **Colour-vision deficiency.** About 8% of men and 0.5% of women of Northern European descent have a
   red-green deficiency ([NEI](https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness/types-color-blindness)).
   WCAG 1.4.1 forbids colour as the only means of conveying information
   ([Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)). Simulate with
   Machado et al. 2009 matrices ([paper](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html))
   for protanopia, deuteranopia, tritanopia; success/error must differ in lightness and carry an icon or text.
8. **Spacing and reading.** 4 px base / 8 px rhythm is the common grid (M3 uses 4 dp increments,
   [M3 layout](https://m3.material.io/foundations/layout/understanding-layout/spacing)); WCAG 1.4.12
   requires layouts to survive line-height 1.5, paragraph spacing 2×, letter 0.12em, word 0.16em
   ([Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)); measure
   45–75 characters, ~66 ideal ([Butterick, Practical Typography](https://practicaltypography.com/line-length.html)).
   Proximity (Gestalt) means inner padding < gap between groups.
9. **Separation.** Modern systems (M3 tonal surfaces/surface containers, Apple grouped backgrounds,
   Radix steps 1–3) separate regions by **tone** first, outline second, shadow for floating layers.
   An outline is needed only where tone steps are below ~3:1 non-text *and* the boundary is
   interactive (inputs, WCAG 1.4.11); decorative card outlines add noise.

## Decision

### 1. Theme-level guarantee

- **Pair registry.** One table in `theme/contrast.ts` lists every token pair with its role and
  required level, not just brand and text:
  `surface-*` × `text|textSecondary|textHint`, `brand-fill`/`brand-contrast`,
  `brand-container`/`on-brand-container` (new), `semantic-<s>-fill`/`-contrast`,
  `semantic-<s>-muted`/`on-<s>-muted` (#675), `bubble-outbound|inbound` bg/fg, chip/badge
  solid+subtle, selected/hover rows, disabled (#708), focus ring vs surface (non-text 3:1),
  input border vs surface (non-text 3:1). Components register their pairs; adding a variant
  without a registry entry fails a unit test.
- **Levels per role.**

  | Role | WCAG 2.2 min | APCA |Lc| target |
  |---|---|---|
  | body / message text (≤ 18 px regular) | 4.5:1 | 75 (warn < 75, fail < 60) |
  | labels, buttons, chips (≥ 14 px, 500+) | 4.5:1 | 60 |
  | large / display (≥ 24 px or ≥ 18.66 px bold) | 3:1 | 45 |
  | hint / placeholder | 4.5:1 | 45 |
  | disabled (exempt in WCAG) | — | 30 |
  | non-text (focus ring, input border, icons that carry meaning) | 3:1 | 15 (45 for thin icons) |

- **Derivation in OKLCH** (extend `generatePreset`, keep the existing API): from the seed colour
  derive a 12-step tone scale per scheme at fixed hue, chroma clamped to sRGB/P3 gamut; roles map to
  steps the Radix way (`solid` = step 9 *adjusted*, `container` = 3, `border` = 7, `text` = 11/12).
  `brand-contrast` and every `on-*` are **solved** for the target (Leonardo-style binary search on L),
  not picked from {white, ink}. If neither polarity reaches Lc 60 on the seed, the derived `brand-fill`
  moves in L until white reaches it (light) or ink reaches it (dark); the raw seed stays available as
  `--ca-brand-accent` for icons, dots, progress, links on large text.
- **Fail, don't warn.** `codeatlas-ui theme check` (new CLI subcommand next to `doctor`) and
  `caThemePlugin`/`caUI` at build run the matrix for every preset × scheme × design style.
  Below WCAG AA → error (build fails; `contrast: "warn"` opt-out per preset, logged). Below the APCA
  target → warning. Message names the pair, both values, and the nearest fixing colour.
- **Hand-set colours** are validated the same way; a hand-set role that fails is an error, not
  silently replaced.

### 2. Component-level

- Any variant that puts text on brand/semantic colour (Button solid, Badge, Chip, MessageBubble
  outbound, selected NavItem, Avatar fallback, AudioPlayer `tone="inherit"` #748) reads only derived
  pair tokens (`--ca-brand-fill` + `--ca-brand-contrast`, `--ca-brand-container` + `--ca-on-brand-container`).
- **MessageBubble outbound** defaults to `container` (tonal) with `variant="solid"` opt-in; solid uses
  the adjusted fill, never the raw seed.
- **Lint** (`lint:tokens` in the repo and `codeatlas-ui lint` for consumers): flag `color` and
  `background` in the same rule block using tokens from different pairs, a raw hex/oklch on either
  side, `--ca-brand` (raw seed) as a background behind text, and `opacity` < 1 on text containers (#19).
- **Runtime dev warning** (dev builds only, stripped in prod): a `MutationObserver`-free check on mount
  of registered components computing `getComputedStyle` colour/background (alpha composited up the
  tree) and `console.warn` once per pair below AA, mirroring the build message.

### 3. Comfort guidance (documented in theme docs, enforced where measurable)

- **Saturation/area.** Solid brand fill (OKLCH C > 0.10 at L 0.55–0.75) only on elements ≤ ~48 px
  tall or ≤ ~10 % of the viewport: buttons, chips, dots, progress. Areas (bubbles, banners, selected
  rows, hero cards) use `container` (C ≤ 0.04 light, ≤ 0.05 dark). Dark scheme reduces brand chroma
  by ~20 % and avoids `#000` background / `#fff` body text (target L ≈ 0.14–0.18 surface, L ≈ 0.93 text).
- **Separation.** Tone first: background → surface → raised differ by ΔL ≥ 0.02 (light) / 0.03 (dark).
  Cards default to no outline (`borderSubtle` at most, never `borderStrong`); outlines kept for
  inputs and interactive boundaries at ≥ 3:1. Shadows only for floating layers (menus, dialogs, toasts).
- **Spacing.** 4 px base, scale 4/8/12/16/24/32/48/64; inner padding < group gap; bubbles ≥ 8×12 px
  padding, ≥ 4 px between consecutive bubbles from the same sender and ≥ 12 px between senders; body
  line-height 1.5 (1.4 for ≤ 14 px UI text, 1.2 for display); measure ≤ 70ch in reading surfaces
  (bubble max-width 65ch / 75 %). Density presets (`comfortable` default, `compact` #672) scale the
  spacing tokens, never the type below 14 px nor touch targets below 24×24 (WCAG 2.5.8).
- **Meaning.** Status always pairs colour with icon/text; semantic hues differ in L by ≥ 0.1 so they
  survive deuteranopia/protanopia.
- **Psychology.** No token rationale cites colour-emotion claims; brand hue for identity, neutrals for
  work surfaces, colour for state.

### 4. Test plan

- **Contrast matrix (unit, CI):** every builtin preset + a fuzz set of seeds (36 hues × 3 chroma ×
  3 lightness, incl. `#00afea`, yellow, lime, orange: the mid-tone traps) × light/dark × design styles
  × the pair registry. Assert WCAG ≥ level and APCA ≥ target; snapshot the report so value drifts show
  in review. Extends `preset-roles.svelte.test.ts` / `DesignStylesMatrix.test.svelte`.
- **Browser (vitest browser + axe):** `color-contrast` rule on the stories of every component variant
  in both schemes, plus the runtime dev warning asserting zero logs.
- **CVD snapshots:** VRT (`DesignStyles.vrt.test.ts` pattern) of status/badge/chart/bubble stories
  through Machado matrices (protan, deutan, tritan) via an SVG `feColorMatrix` filter; assert ΔL ≥ 0.1
  between semantic pairs numerically, screenshots for review.
- **Lint fixtures:** passing and failing CSS for each new lint rule.
- **CLI:** `theme check` exit codes (0 clean, 1 AA failure, 0 + warnings for APCA).

### 5. Case study: R2K (`#00afea`)

- Seed: OKLCH ≈ (0.68, 0.14, 232). Black 8.32:1 / Lc 55; white 2.52:1 / Lc −54. Under the new
  check: **build error for body text on the seed, label-only allowed** → the plugin derives
  `brand-fill` ≈ `#0077a3` (white 5.04:1 / Lc −80) for light, keeps `#00afea` as `brand-accent`.
- Outbound bubble: `container` light ≈ `#e0f5fd` with `#003549` text (11.6:1 / Lc 91); dark ≈
  OKLCH(0.30 0.06 232) with L 0.93 text. Raw `#00afea` only for the sent-tick/accent.
- Cards: drop `border`/`borderStrong` outlines; rely on `#f6f3ee` → `#fffdf9` tone step (light) and
  `#060f18` → `#0c1925` (dark); keep `borderSubtle` only for list dividers.
- Spacing: move bubble padding to 8×12, group gaps to 12/16, card padding to 16–24, line-height 1.5,
  bubble max-width 65ch.
- Consumer action until the library ships: in `apps/backoffice/src/lib/theme.ts` set
  `colors.light.brandFill: '#0077a3'`, `brandContrast: '#ffffff'` and use a tonal bubble.

## Consequences

- Presets that ship today with failing pairs will break builds; release as minor with a
  `contrast: "warn"` escape hatch for one minor, then error.
- Derived `brand-fill` may differ from the marketing hex; the seed remains available as accent. This
  is the same trade-off M3 makes and is documented in the theme docs.
- APCA is a draft method: thresholds live in one constant table so they can follow WCAG 3.
- Cost: colour math stays build-time (`contrast.ts` is not imported by runtime entries); the dev
  warning is dev-only.

## Alternatives rejected

- **Keep warnings only:** the history of #22 → #749 shows warnings do not stop regressions.
- **WCAG only:** approves black on `#00afea` for message text.
- **APCA only:** not a legal standard; AA is required by procurement and law (EAA, ADA/Section 508).
- **Per-component fixes:** the current approach; one issue per pair.
