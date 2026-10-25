// The design-style pages (`/styles/<id>/`): one record per design style. Plain data and pure functions,
// shared by the Astro pages, the llms digest, the MCP build and the tests, so the text a person reads and
// the text an agent gets are the same. Every claim about users names a verified reference of
// `site/src/data/evidence/references.json`, a strength label and its scope; the rules are on
// /docs/concepts/evidence/. The history is our own writing and names no person, product or publication.
import { DESIGN_STYLES, type DesignStyleId } from "../../../../packages/ui/src/lib/theme/styles.ts";
import { getReference, type Reference, type Strength } from "../evidence/references.ts";

/** The styles that have a page, in the order of the index. The atlas links a style only when it is listed here. */
export const STYLE_PAGE_IDS = [
	"swiss",
	"editorial",
	"brutalism",
	"sketchbook",
	"glassmorphism",
	"terminal",
] as const satisfies readonly DesignStyleId[];
export type StylePageId = (typeof STYLE_PAGE_IDS)[number];

export const isStylePage = (id: string): id is StylePageId =>
	(STYLE_PAGE_IDS as readonly string[]).includes(id);

/** `/styles/<id>/` for a style that has a page, `null` otherwise (same contract as the atlas `styleHref`). */
export const styleHref = (id: string): string | null => (isStylePage(id) ? `/styles/${id}/` : null);

export const TRAIT_AXES = ["type", "colour", "shape", "depth", "motion"] as const;
export type TraitAxis = (typeof TRAIT_AXES)[number];

/** A claim about users or about a standard, with its source, strength and scope (same fields as `<Claim>`). */
export interface StyleClaim {
	strength: Strength;
	/** Reference ids of the references dataset. Empty only for `heuristic`. */
	refs: string[];
	/** Who or what was studied, or which criterion; why it does not generalize. Empty only for `heuristic`. */
	scope: string;
	text: string;
}

export interface Pitfall {
	/** What goes wrong, in one sentence. */
	title: string;
	/** What to do about it; the recipe and the components already do it when a token can. */
	fix: string;
	claim: StyleClaim;
}

/** A component shown twice: with the style and with the plain package default. */
export type ShowcaseId = "actions" | "form" | "card" | "feedback" | "table";

export interface StyleDoc {
	id: StylePageId;
	/** Page `<h1>` and nav label. */
	name: string;
	/** One line for cards, meta description and the llms digest. */
	tagline: string;
	/** Atlas terms the recipe implements (DESIGN_STYLES taxonomy), by id. */
	atlas: string[];
	/** Our own account of where the style comes from and what it reacted against: no names. */
	origin: string[];
	/** One entry per axis; `tokens` are the `--ca-*` tokens the recipe sets for it. */
	traits: Record<TraitAxis, { summary: string; tokens: string[] }>;
	dos: string[];
	donts: string[];
	pitfalls: Pitfall[];
	/** Components that suit the style, with the one-line reason; each links to its docs page. */
	fits: { component: string; href: string; why: string }[];
	/** Where it tends to fit and where it does not: a judgement, labelled as such on the page. */
	fitsWhen: string;
	avoidWhen: string;
	/** Showcases to render before/after, in order. */
	showcases: ShowcaseId[];
	/** `elevation` of the cards in the showcase: a glass recipe shows its blur at 3 (the regular tier), the rest at the default. */
	cardElevation?: 0 | 1 | 2 | 3 | 4 | 5;
	reviewed: string;
	limits: string[];
}

const REVIEWED = "2026-10-25";

const standardLimits = [
	"The recipe is a proposal built from the library's design knobs. It is not a measurement of any named visual language, and a real product in that language will differ.",
	"The sources behind the claims on this page cover contrast, text spacing, target size, motion and the way appeal is judged. None of them shows that this style performs better or worse than another.",
	"Before and after toggles show the same components with different tokens. They do not show how a style reads on your content, your brand colour or your users' devices.",
];

export const STYLES: Record<StylePageId, StyleDoc> = {
	swiss: {
		id: "swiss",
		name: "Swiss",
		tagline: "A grid, hairlines, square corners and no shadows: order and legibility first.",
		atlas: DESIGN_STYLES.swiss.taxonomy,
		origin: [
			"This style comes from mid-century print, where designers in a few European cities decided that a page should be built from a grid and a small, strict set of type sizes instead of from decoration. Everything was set flush on a column, hierarchy came from size and weight rather than from ornament, and white space was treated as a working part of the layout.",
			"It travelled to screens because screens are grids too. Tables, forms, dashboards and documentation reward a layout where every element lines up, where one sans-serif family does all the work and where a thin rule is enough to separate two things. It reads as neutral, which is its strength in tools and its weakness in anything that needs a personality.",
		],
		traits: {
			type: {
				summary:
					"One neutral sans-serif family for body and display. Headings are bold with slightly tight tracking; small labels are uppercase with open tracking, so a label never competes with the heading above it.",
				tokens: [
					"--ca-font-sans",
					"--ca-font-display",
					"--ca-font-weight-heading",
					"--ca-heading-tracking",
					"--ca-label-case",
					"--ca-label-tracking",
				],
			},
			colour: {
				summary:
					"Mostly paper and ink. The brand colour is a single accent used for the one thing you want noticed; surfaces stay neutral so the grid, not the palette, carries the structure.",
				tokens: [
					"--ca-brand-fill",
					"--ca-surface-base",
					"--ca-surface-raised",
					"--ca-outline-default",
				],
			},
			shape: {
				summary:
					"Square corners everywhere and a visible one-pixel rule around surfaces (the outlined material). Controls are rectangles; nothing is a pill.",
				tokens: ["--ca-radius-scale", "--ca-border-width", "--ca-border-width-strong"],
			},
			depth: {
				summary:
					"None. Separation comes from rules and spacing, not from shadow, blur or tint, so a card and the page differ by a line, not by a lift.",
				tokens: ["--ca-shadow-sm", "--ca-shadow-md", "--ca-mat-edge"],
			},
			motion: {
				summary:
					"Short and plain. Transitions run at about 70% of the default duration with the standard curve; nothing bounces and nothing moves unless the state changed.",
				tokens: ["--ca-motion-scale", "--ca-ease-standard"],
			},
		},
		dos: [
			"Align everything to one column grid and one spacing scale, and let the gaps between groups be larger than the gaps inside a group.",
			"Use size and weight for hierarchy before you reach for colour.",
			"Keep one accent colour and spend it on the primary action of each screen.",
			"Use a rule, not a shadow, to separate a surface from the page.",
		],
		donts: [
			"Do not add gradients, glows or rounded pills to soften it; the style is the absence of them.",
			"Do not centre long text. Set it flush left on the grid.",
			"Do not use more than two weights of the family on one screen.",
			"Do not mistake plain for finished: neutral surfaces still need a clear focus state and states for hover, pressed and disabled.",
		],
		pitfalls: [
			{
				title: "Hairlines can fall below the contrast a control needs",
				fix: "Keep control outlines on the stronger outline token (`--ca-outline-control`), not on the subtle divider token. The preset contrast test measures 3:1 for it in every built-in preset.",
				claim: {
					strength: "practice",
					refs: ["W04"],
					scope:
						"WCAG 2.2 criterion 1.4.11: meaningful visual cues, such as the boundary of an input, need 3:1 against the background. The criterion sets no minimum line width, so a thin line is allowed when its contrast is enough.",
					text: "A field that is only a pale one-pixel outline can fail the non-text contrast requirement even when the page looks tidy.",
				},
			},
			{
				title: "Tight, uppercase labels get hard to read when a user widens the spacing",
				fix: "Do not rely on a fixed box height for a label. Let the line grow when text spacing is overridden, which the components do by using min-height rather than height.",
				claim: {
					strength: "practice",
					refs: ["W03"],
					scope:
						"WCAG 2.2 criterion 1.4.12: no loss of content or function when a user sets line height to 1.5, letter spacing to 0.12 and word spacing to 0.16 times the font size. It constrains what breaks, not what the page must use.",
					text: "Open uppercase tracking is safe by itself; clipping a label inside a fixed-height box is what breaks when a user applies their own spacing.",
				},
			},
		],
		fits: [
			{
				component: "SimpleTable",
				href: "/docs/display/table/",
				why: "Rules and a column grid are what a dense table needs.",
			},
			{
				component: "TextField",
				href: "/docs/inputs/text-field/",
				why: "A rectangular outlined field reads clearly as an input.",
			},
			{
				component: "Tabs",
				href: "/docs/navigation/tabs/",
				why: "Line tabs on a hairline suit a grid layout.",
			},
			{
				component: "Breadcrumb",
				href: "/docs/navigation/breadcrumb/",
				why: "Plain, aligned navigation text.",
			},
		],
		fitsWhen:
			"Tools, documentation, admin screens, reports and anything dense where people scan and compare. It tends to fit teams that want the interface to disappear behind the content.",
		avoidWhen:
			"A product that has to be remembered for its look, a children's or entertainment audience, or a screen where one hero moment has to carry emotion.",
		showcases: ["actions", "form", "table", "feedback"],
		reviewed: REVIEWED,
		limits: standardLimits,
	},

	editorial: {
		id: "editorial",
		name: "Editorial",
		tagline: "A serif display face, a long line and plenty of space: reading comes first.",
		atlas: DESIGN_STYLES.editorial.taxonomy,
		origin: [
			"Print journalism and long-form publishing solved a problem that a lot of software now has: how to hold a person's attention on a lot of text for more than a few seconds. The answers were a clear typographic hierarchy, a measure short enough to follow, generous margins, hairline rules between sections and a display face with character set against a quiet text face.",
			"On screen the same moves make a product feel curated instead of busy. The cost is that a page built for reading can hide its actions: when everything is quiet, the one button that matters can disappear, so the style asks for deliberate emphasis where it counts.",
		],
		traits: {
			type: {
				summary:
					"A serif for display and headings, a clean text face for the body, a slightly larger scale, a line height near 1.7 and a measure capped at about 65 characters.",
				tokens: [
					"--ca-font-display",
					"--ca-font-scale",
					"--ca-line-height-body",
					"--ca-measure",
					"--ca-label-case",
					"--ca-label-tracking",
				],
			},
			colour: {
				summary:
					"Restrained and warm-neutral. Ink on paper with one accent; large areas stay close to the page colour so the text carries the page.",
				tokens: [
					"--ca-brand-fill",
					"--ca-surface-base",
					"--ca-text-primary",
					"--ca-text-secondary",
				],
			},
			shape: {
				summary:
					"Nearly square corners (a fifth of the default radius) and hairline dividers. Surfaces are flat panels, not floating cards.",
				tokens: ["--ca-radius-scale", "--ca-border-width"],
			},
			depth: {
				summary:
					"None. No shadows and no blur; the flat material separates with a hairline. Rhythm comes from spacing and rules.",
				tokens: ["--ca-shadow-md", "--ca-mat-edge"],
			},
			motion: {
				summary:
					"Calm and a little slower than default (about 130%): a fade or a short slide that never competes with the text.",
				tokens: ["--ca-motion-scale", "--ca-ease-standard"],
			},
		},
		dos: [
			"Cap the line length of running text; wider is not more comfortable.",
			"Pair one expressive display face with a plain text face, and keep to two families.",
			"Use space and a hairline, not a box, to group related content.",
			"Make the primary action visibly an action: a filled button, not a text link.",
		],
		donts: [
			"Do not use a display serif for small interface text such as table cells, badges or captions.",
			"Do not hide navigation to keep the page quiet; people should see where the routes are.",
			"Do not set long text in all caps; reserve uppercase for short labels.",
			"Do not let a hero image push the first paragraph off the first screen without a reason.",
		],
		pitfalls: [
			{
				title: "Airy spacing and a wide display scale can break at large text sizes",
				fix: "Use relative units for sizes and test at 200% text size. Containers should grow with the text instead of clipping it.",
				claim: {
					strength: "practice",
					refs: ["W02"],
					scope:
						"WCAG 2.2 criterion 1.4.4: text can be resized up to 200 percent without assistive technology and without loss of content or function. It says nothing about which typeface or size to start from.",
					text: "A page that looks balanced at 100% can overlap or clip when a reader enlarges the text.",
				},
			},
			{
				title: "A quiet page can hide the one action that matters",
				fix: "Give the primary action the brand fill and a clear label; keep secondary actions as outlined or text buttons.",
				claim: {
					strength: "heuristic",
					refs: [],
					scope: "",
					text: "When every element is understated, nothing signals what to do next. We have seen this on our own pages, but we have no study to point to, so test it with your users.",
				},
			},
		],
		fits: [
			{
				component: "Heading",
				href: "/docs/display/heading/",
				why: "The display size reads the serif display family.",
			},
			{
				component: "Card",
				href: "/docs/surfaces/card/",
				why: "A flat card with a hairline is a column, not a tile.",
			},
			{
				component: "Highlight",
				href: "/docs/display/highlight/",
				why: "A hand-set emphasis inside running text.",
			},
			{
				component: "Accordion",
				href: "/docs/surfaces/accordion/",
				why: "Progressive disclosure for long pages.",
			},
		],
		fitsWhen:
			"Content-led products: publications, documentation, case studies, portfolios, reports and pricing or product pages that tell a story before they sell.",
		avoidWhen:
			"Dense operational tools, small-screen data entry, or anywhere a user scans for a value rather than reads.",
		showcases: ["card", "actions", "form", "feedback"],
		reviewed: REVIEWED,
		limits: standardLimits,
	},

	brutalism: {
		id: "brutalism",
		name: "Brutalism",
		tagline: "Thick strokes, hard offset shadows, flat fills and loud type.",
		atlas: DESIGN_STYLES.brutalism.taxonomy,
		origin: [
			"The name was borrowed from architecture, where raw, exposed structure was left visible instead of being finished over. On the web it began as a reaction to interfaces that had become uniformly smooth: rounded, soft, gradient-filled and nearly interchangeable. Early sites in this spirit used default fonts, visible grids and harsh contrast on purpose.",
			"The version used in product interfaces today is gentler and more systematic. It keeps the visible structure (heavy outlines, flat saturated fills, a shadow that is a solid offset block rather than a blur) and drops the hostility. It is loud on purpose, which makes it memorable and also tiring: it works as an accent for a brand moment far better than as the surface of a long working session.",
		],
		traits: {
			type: {
				summary:
					"Heavy, uppercase headings at weight 900 in a system sans-serif, tight tracking, bold labels. Type is a graphic element, not a quiet carrier.",
				tokens: [
					"--ca-font-weight-heading",
					"--ca-heading-case",
					"--ca-heading-tracking",
					"--ca-label-case",
					"--ca-label-tracking",
				],
			},
			colour: {
				summary:
					"Flat, saturated fills against a black stroke. No gradients, no tints. The brand colour is used at full strength, which is why contrast has to be checked per preset.",
				tokens: ["--ca-brand-fill", "--ca-brand-contrast", "--ca-border-color"],
			},
			shape: {
				summary:
					"Square corners and a three to four pixel outline on every surface and control. Icons are drawn with a heavier stroke to match.",
				tokens: [
					"--ca-radius-scale",
					"--ca-border-width",
					"--ca-border-width-strong",
					"--ca-icon-stroke",
				],
			},
			depth: {
				summary:
					"A hard offset shadow: a solid copy of the border colour pushed down and to the right, with no blur. Bigger surfaces cast a bigger offset.",
				tokens: ["--ca-shadow-sm", "--ca-shadow-md", "--ca-shadow-lg", "--ca-mat-regular-shadow"],
			},
			motion: {
				summary:
					"Fast and stepped: half the default duration with a stepped curve, so a state change snaps instead of gliding.",
				tokens: ["--ca-motion-scale", "--ca-ease-standard"],
			},
		},
		dos: [
			"Keep one outline weight and one shadow offset per elevation, and repeat them everywhere.",
			"Use the loud treatment on a few things and leave the rest plain, so the loud parts still read as loud.",
			"Check the text colour on every saturated fill; the brand colour has to carry its label.",
			"Keep real hierarchy and real navigation under the shouting: order, spacing and clear labels.",
		],
		donts: [
			"Do not use it for the whole of a long form or a dense table; the heavy lines add up to noise.",
			"Do not use the shadow offset as the only way to show a pressed or selected state.",
			"Do not combine it with blur, gradients or soft tints; that is a different style.",
			"Do not set long paragraphs in uppercase or at heading weight.",
		],
		pitfalls: [
			{
				title: "Saturated fills with white or black text can miss the contrast ratio",
				fix: "Take the label colour from `--ca-brand-contrast`, which the preset derives from the fill, and run the preset contrast check when you change the brand colour.",
				claim: {
					strength: "practice",
					refs: ["E07"],
					scope:
						"WCAG 2.2 Quick Reference, contrast criteria: text needs at least 4.5:1 (3:1 for large text) against its background at level AA. It states what content must do, not what users prefer.",
					text: "A bright yellow or pure green fill looks right in a mock-up and can fail the text contrast requirement with a white label.",
				},
			},
			{
				title: "Constant strong stimulation is tiring in long sessions",
				fix: "Confine the style to marketing surfaces, empty states and accents; use a calmer recipe for the working screens of the same product.",
				claim: {
					strength: "heuristic",
					refs: [],
					scope: "",
					text: "Heavy outlines on every control raise the visual weight of the whole screen. We have not found a source that measures fatigue for this style, so treat it as a judgement and test it with the people who use the product all day.",
				},
			},
			{
				title: "A hard shadow can be the only cue for a pressed button",
				fix: "Also change the fill or the label on press and keep a visible focus ring; the components do both.",
				claim: {
					strength: "practice",
					refs: ["W04"],
					scope:
						"WCAG 2.2 criterion 1.4.11: a visual cue that is needed to identify a control or its state needs 3:1 against its surroundings. A shifted shadow is a cue only if it meets that.",
					text: "State changes carried only by an offset that moves a few pixels are easy to miss, and are not a reliable signal on their own.",
				},
			},
		],
		fits: [
			{
				component: "Button",
				href: "/docs/inputs/button/",
				why: "A flat fill, a heavy stroke and a hard shadow define the style.",
			},
			{
				component: "Card",
				href: "/docs/surfaces/card/",
				why: "A thick-bordered tile with an offset shadow.",
			},
			{ component: "Badge", href: "/docs/display/badge/", why: "Small saturated labels." },
			{
				component: "Alert",
				href: "/docs/display/alert/",
				why: "A bold banner that cannot be missed.",
			},
		],
		fitsWhen:
			"Creator tools, campaigns, portfolios, onboarding and landing moments where being remembered matters more than long-session comfort.",
		avoidWhen:
			"Dense data entry, finance and health screens, and any product used for hours a day.",
		showcases: ["actions", "card", "feedback", "form"],
		reviewed: REVIEWED,
		limits: standardLimits,
	},

	sketchbook: {
		id: "sketchbook",
		name: "Sketchbook",
		tagline: "A journal on grid paper: serif display, square outlined cards, hand-drawn marks.",
		atlas: DESIGN_STYLES.sketchbook.taxonomy,
		origin: [
			"Before software, products were worked out on paper: graph-ruled pads, pencil, a margin note with an arrow, a circled word. A sketchbook look borrows that working surface on purpose. It says that the thing is in progress and made by hand, which lowers the stakes of reading it and suits tools for people who make things.",
			"This is the language of the documentation you are reading. We chose it because it carries two moods at once: the structure of a printed grid and the warmth of marks made with a pen. It sits between the rigour of a plain grid style and the shouting of a heavy-stroke style, with outlined cards that cast a hard offset shadow and a serif for headings.",
		],
		traits: {
			type: {
				summary:
					"A serif display face over a plain body face, semibold headings, uppercase labels with open tracking, and a generous line height near 1.65. Captions are italic.",
				tokens: [
					"--ca-font-display",
					"--ca-font-weight-heading",
					"--ca-label-case",
					"--ca-label-tracking",
					"--ca-line-height-body",
				],
			},
			colour: {
				summary:
					"Paper and pencil: a quiet surface, graphite text, and the brand colour for marks and the active state. The page grid is drawn in a subtle outline colour so it stays texture.",
				tokens: ["--ca-brand-main", "--ca-outline-subtle", "--ca-mark-color", "--ca-page-mesh"],
			},
			shape: {
				summary:
					"Square corners with a two to three pixel outline. Hand-drawn underlines and margin notes (`.ca-mark-underline`, `.ca-mark-note`) add the pen.",
				tokens: ["--ca-radius-scale", "--ca-border-width", "--ca-border-width-strong"],
			},
			depth: {
				summary:
					"A hard offset shadow, like a card laid on a desk. No blur. The paper itself is flat grid lines.",
				tokens: ["--ca-shadow-md", "--ca-mat-regular-shadow"],
			},
			motion: {
				summary:
					"Short and plain at about 60% of the default, with the standard curve: things appear, they do not perform.",
				tokens: ["--ca-motion-scale", "--ca-ease-standard"],
			},
		},
		dos: [
			"Keep the grid faint; it is texture behind the content, not a pattern in front of it.",
			"Use the hand-drawn marks sparingly, once or twice a page, on the words that matter.",
			"Let captions and notes be italic and secondary so the body stays plain.",
			"Pair it with a light and a dark scheme and check the grid ink in both.",
		],
		donts: [
			"Do not draw a mark on every heading; a mark only means something when it is rare.",
			"Do not put text over the grid lines at a size where they cross the letters.",
			"Do not use a handwriting font for body text. The warmth comes from marks and layout, not from illegible type.",
			"Do not add blur or gradients; they fight the paper.",
		],
		pitfalls: [
			{
				title: "A busy background pattern can reduce how readable text over it is",
				fix: "Keep the paper pattern at low contrast (it uses `--ca-outline-subtle` at about half strength) and keep text on a raised, opaque surface rather than directly on the grid.",
				claim: {
					strength: "practice",
					refs: ["E07"],
					scope:
						"WCAG 2.2 Quick Reference, contrast criteria: text needs 4.5:1 against its background. A background pattern counts as part of the background, so the lines under text are measured too.",
					text: "Grid or dotted paper behind body text is a background the text contrast has to survive.",
				},
			},
			{
				title: "Decorative marks must not carry meaning",
				fix: "Marks are drawn with CSS masks and are not announced; any emphasis they give must also be in the words (bold, a label, an order), and in forced-colors mode they fall back to the system text colour.",
				claim: {
					strength: "practice",
					refs: ["E07"],
					scope:
						"WCAG 2.2 Quick Reference: information conveyed only through a visual device needs a text or programmatic equivalent. It says what must be available, not how a mark is perceived.",
					text: "A hand-drawn circle around a word tells a sighted reader that it matters; a screen reader hears nothing, so the importance has to be stated in text as well.",
				},
			},
		],
		fits: [
			{
				component: "Highlight",
				href: "/docs/display/highlight/",
				why: "A hand-drawn emphasis on the words that matter.",
			},
			{
				component: "Card",
				href: "/docs/surfaces/card/",
				why: "An outlined card with a hard shadow is a page of the book.",
			},
			{
				component: "Callout",
				href: "/docs/docs-kit/docs/",
				why: "A margin note with a clear tone.",
			},
			{
				component: "CodeSnippet",
				href: "/docs/display/code-snippet/",
				why: "A boxed block that sits well on paper.",
			},
		],
		fitsWhen:
			"Developer tools, documentation, learning products, portfolios and products for people who make things, where warmth and structure should coexist.",
		avoidWhen:
			"Formal institutions, finance, or any context where a hand-made look would read as unserious.",
		showcases: ["card", "actions", "feedback", "form"],
		reviewed: REVIEWED,
		limits: standardLimits,
	},

	glassmorphism: {
		id: "glassmorphism",
		name: "Glassmorphism",
		tagline:
			"Translucent, blurred layers over a colourful backdrop, with thin rims and soft shadows.",
		atlas: DESIGN_STYLES.glassmorphism.taxonomy,
		origin: [
			"Operating systems began putting frosted, translucent panels over their backgrounds once graphics hardware could blur what sits behind a layer in real time. The idea is about depth: a control layer floats above the content layer, and you can see that the content continues underneath. When it spread to the web it became a look in its own right, usually over a gradient or a photo.",
			"It is expressive and it is fragile. The text on a glass panel sits on whatever happens to be behind it, so legibility depends on the backdrop, on the blur and on the tint all at once. It works best as a layer for a few controls and overlays, not as the surface of everything.",
		],
		traits: {
			type: {
				summary:
					"Nothing special: the style leaves type alone. Weight and size matter more than usual because the background is busy; use the regular text weight at body size or larger.",
				tokens: ["--ca-font-sans", "--ca-font-weight-heading"],
			},
			colour: {
				summary:
					"A colourful or photographic backdrop (the page mesh) with the panel tinted by the surface colour. The glass rim is a one-pixel highlight, bright in light mode and fainter in dark.",
				tokens: ["--ca-glass-rim", "--ca-glass-tint", "--ca-page-mesh", "--ca-brand-main"],
			},
			shape: {
				summary:
					"Generously rounded corners (about 1.4 times the default scale) and a large control radius, so panels read as soft sheets.",
				tokens: ["--ca-radius-scale", "--ca-radius-control"],
			},
			depth: {
				summary:
					"The whole point: a stronger backdrop blur with extra saturation, three thicknesses (thin, regular, thick), a soft shadow and a little grain so large blurred areas do not band.",
				tokens: [
					"--ca-blur-thin",
					"--ca-blur-regular",
					"--ca-blur-thick",
					"--ca-noise-opacity",
					"--ca-glass-shadow",
				],
			},
			motion: {
				summary: "Smooth and emphasized at the default speed: panels ease in rather than snap.",
				tokens: ["--ca-motion-scale", "--ca-ease-standard"],
			},
		},
		dos: [
			"Put text on a tinted, thick-enough layer, not on a thin one over a busy picture.",
			"Use blur for a layer that floats above content (a toolbar, a sheet, a menu) and keep the content layer opaque.",
			"Test over the lightest and the darkest part of the backdrop, in both schemes.",
			"Provide the opaque fallback: with transparency reduced the panel should become a solid surface.",
		],
		donts: [
			"Do not stack glass on glass; blur compounds and the text loses its ground.",
			"Do not use it for dense data tables or long forms.",
			"Do not rely on a faint rim as the only edge of a control.",
			"Do not animate large blurred areas continuously; it costs frames on modest devices.",
		],
		pitfalls: [
			{
				title:
					"Text contrast depends on what is behind the panel, so it changes as content scrolls",
				fix: "Raise the tint of the layer that holds text (use the regular or thick tier for body text), and test the worst backdrop. Use an opaque base behind long text.",
				claim: {
					strength: "practice",
					refs: ["E07"],
					scope:
						"WCAG 2.2 Quick Reference, contrast criteria: text needs 4.5:1 against its background at level AA. A translucent panel's effective background is whatever shows through it.",
					text: "A panel that passes over a dark part of a gradient can fail over a bright part of the same gradient.",
				},
			},
			{
				title: "A faint rim may not be enough to identify a control",
				fix: "Give inputs and buttons a stronger outline token or a fill, not only the highlight rim.",
				claim: {
					strength: "practice",
					refs: ["W04"],
					scope:
						"WCAG 2.2 criterion 1.4.11: visual information needed to identify a control needs 3:1 against adjacent colours.",
					text: "A white highlight on a light blurred panel is a cue that is easy to lose.",
				},
			},
			{
				title:
					"Platform guidance treats glass as a separate control layer, not as a surface for content",
				fix: "Use glass for navigation and controls that float over content, and keep the content itself on a solid layer.",
				claim: {
					strength: "practice",
					refs: ["E12"],
					scope:
						"A platform owner's design guidance for its own system material. It is guidance, not a study, and it does not show better outcomes for users.",
					text: "The guidance describes the material as a functional layer for controls and navigation that floats above content, which is the use this recipe supports best.",
				},
			},
		],
		fits: [
			{
				component: "Card",
				href: "/docs/surfaces/card/",
				why: "The panel itself: `elevation` 2, 3 and 4 are the thin, regular and thick glass tiers.",
			},
			{
				component: "Tabs",
				href: "/docs/navigation/tabs/",
				why: "A pill tab list is a glass control over content.",
			},
			{ component: "Badge", href: "/docs/display/badge/", why: "Small tinted status pills." },
			{
				component: "Alert",
				href: "/docs/display/alert/",
				why: "A tinted banner that still reads over the backdrop.",
			},
		],
		fitsWhen:
			"Media, dashboards over a hero visual, landing pages and overlays: a few floating layers over rich content.",
		avoidWhen:
			"Dense tables, long text, low-end devices, or any screen where legibility cannot be guaranteed over the backdrop.",
		showcases: ["card", "actions", "feedback", "form"],
		cardElevation: 3,
		reviewed: REVIEWED,
		limits: [
			...standardLimits,
			"Blur is rendered by the browser and its cost depends on the device. We have not measured it for this page, so check the frame rate on the lowest-end device you support.",
		],
	},

	terminal: {
		id: "terminal",
		name: "Terminal",
		tagline: "Monospace everywhere, square cells, outlined panels and instant motion.",
		atlas: DESIGN_STYLES.terminal.taxonomy,
		origin: [
			"Before graphical interfaces, people worked in text: a grid of fixed-width characters, a prompt, and output that scrolled by. Programmers still do much of their work there, and the look has become a shorthand for tools that are exact, fast and built for people who read code.",
			"As an interface style it uses one monospace family for everything, tight spacing, square outlined panels and no easing. It packs a lot of information into a small area and rewards people who already read that way. It is a poor first impression for someone who does not, so it asks for obvious graphical navigation next to the text.",
		],
		traits: {
			type: {
				summary:
					"One monospace family for body, display and code, a slightly smaller scale, bold headings with no tracking and uppercase labels. Columns line up because every character has the same width.",
				tokens: [
					"--ca-font-sans",
					"--ca-font-display",
					"--ca-font-mono",
					"--ca-font-scale",
					"--ca-label-case",
				],
			},
			colour: {
				summary:
					"Dark by default: a near-black surface, bright text and one accent used like a phosphor. The recipe defaults to the dark scheme; the light scheme is still supported.",
				tokens: ["--ca-brand-fill", "--ca-surface-base", "--ca-text-primary"],
			},
			shape: {
				summary:
					"Square corners and one-pixel outlines on every panel, like cells in a grid. Compact density keeps rows tight.",
				tokens: ["--ca-radius-scale", "--ca-density", "--ca-border-width"],
			},
			depth: {
				summary: "None. Panels are outlined rectangles; there is no shadow, blur or tint.",
				tokens: ["--ca-shadow-md", "--ca-mat-edge"],
			},
			motion: {
				summary:
					"None by design: the motion scale is zero and the curve is stepped, so state changes are instant. This also makes the recipe safe for people who reduce motion.",
				tokens: ["--ca-motion-scale", "--ca-ease-standard"],
			},
		},
		dos: [
			"Use the monospace family for data, identifiers and code, where alignment helps comparison.",
			"Keep a visible, high-contrast focus ring; keyboard users are this style's main audience.",
			"Offer plain graphical navigation (a sidebar or tabs) beside any command-style input.",
			"Keep rows compact but keep touch targets large enough on touch devices.",
		],
		donts: [
			"Do not use a monospace face for long paragraphs of prose; the uneven rhythm slows reading.",
			"Do not imitate a blinking cursor everywhere; motion with no meaning is noise.",
			"Do not use green-on-black as the only palette without checking contrast and colour-blind legibility.",
			"Do not hide features behind typed commands with no visible alternative.",
		],
		pitfalls: [
			{
				title: "Compact density can push targets below the minimum pointer size",
				fix: "Keep the interactive area at least 24 by 24 CSS pixels (the components keep a larger hit area than their visible box) and give touch layouts the comfortable density.",
				claim: {
					strength: "practice",
					refs: ["W06"],
					scope:
						"WCAG 2.2 criterion 2.5.8 (Level AA): pointer targets are at least 24 by 24 CSS pixels unless spacing, equivalence, inline, user-agent or essential exceptions apply. 44 pixels is a larger recommendation, not this criterion.",
					text: "Tight rows look right in a terminal-style list and can make the controls inside them too small to hit.",
				},
			},
			{
				title: "Removing all motion is safe, but do not remove state feedback with it",
				fix: "Keep a clear change in fill, outline or label for hover, pressed and selected so the instant transition still shows what changed.",
				claim: {
					strength: "practice",
					refs: ["M06", "E09"],
					scope:
						"MDN describes how to detect a reduced-motion preference. WCAG 2.2 criterion 2.3.3 (Level AAA) says non-essential motion triggered by interaction can trigger vestibular disorders and should be possible to turn off. It makes no claim about how common this is.",
					text: "A style with no motion already honours a reduced-motion setting, so the remaining risk is a state that changes with no visible signal.",
				},
			},
		],
		fits: [
			{
				component: "CodeSnippet",
				href: "/docs/display/code-snippet/",
				why: "Boxed monospace output.",
			},
			{ component: "SimpleTable", href: "/docs/display/table/", why: "Compact, aligned rows." },
			{
				component: "TextField",
				href: "/docs/inputs/text-field/",
				why: "A square, outlined, monospace field.",
			},
			{ component: "Kbd", href: "/docs/display/kbd/", why: "Keyboard hints in the same face." },
		],
		fitsWhen:
			"Developer tools, logs, consoles, infrastructure dashboards and documentation for engineers.",
		avoidWhen:
			"Consumer onboarding, content for general audiences, or anywhere people are not used to reading fixed-width text.",
		showcases: ["table", "form", "actions", "feedback"],
		reviewed: REVIEWED,
		limits: standardLimits,
	},
};

export const STYLE_LIST: readonly StyleDoc[] = STYLE_PAGE_IDS.map((id) => STYLES[id]);

// ── Recipe, as copyable text ──────────────────────────────────────────────────

/** The `ThemeOptions` recipe, as the code a person pastes into `src/lib/theme.ts`. Always the `designStyle(id)` call. */
export function recipeSource(id: StylePageId, withBrand = false): string {
	const args = withBrand
		? `"${id}", {\n\tpresets: [{ id: "acme", color: "#ff5c00" }],\n\tdefaultPreset: "acme",\n}`
		: `"${id}"`;
	return `import { designStyle, type ThemeOptions } from "@codeatlasdev/ui";\n\nexport const theme: ThemeOptions = designStyle(${args});\n`;
}

/** The resolved options of a recipe, printed as a plain object, so the reader sees every knob the style sets. */
export function recipeKnobs(id: StylePageId): string {
	const theme = DESIGN_STYLES[id].theme;
	return JSON.stringify(theme, null, "\t");
}

// ── Prompt ────────────────────────────────────────────────────────────────────

/** A paste-in instruction that carries the style, its limits and the accessibility rules into a coding agent. */
export function stylePrompt(id: StylePageId): string {
	const s = STYLES[id];
	return [
		`Build this interface in the "${s.name}" style with @codeatlasdev/ui: ${s.tagline.replace(/\.$/, "")}.`,
		"",
		`1. In src/lib/theme.ts export \`theme = designStyle("${id}")\` (import it from "@codeatlasdev/ui", or from "@codeatlasdev/ui/vite" in a file shared with vite.config). Add your brand as a preset on top: \`designStyle("${id}", { presets: [{ id: "brand", color: "#…" }], defaultPreset: "brand" })\`.`,
		"2. Use the library components as they are. Change the look only through ThemeOptions or `--ca-*` tokens: no `!important`, no overrides of `.ca-*` classes, no hard-coded colours.",
		`3. The style's traits: type: ${s.traits.type.summary} Shape: ${s.traits.shape.summary} Depth: ${s.traits.depth.summary} Motion: ${s.traits.motion.summary}`,
		`4. Do: ${s.dos.join(" ")}`,
		`5. Do not: ${s.donts.join(" ")}`,
		`6. Accessibility, which this style puts at risk: ${s.pitfalls.map((p) => `${p.title}. ${p.fix}`).join(" ")}`,
		`7. Fits: ${s.fitsWhen} Avoid it when: ${s.avoidWhen}`,
		"8. Keep content, hierarchy and behaviour identical to a plain baseline so the two can be compared. Do not claim the style performs better; validate it with your users.",
		`Docs: https://ui.codeatlas.com.br${styleHref(id)}`,
	].join("\n");
}

// ── References and validation ─────────────────────────────────────────────────

/** Every reference a style page cites, in first-use order, without duplicates. */
export function styleReferences(s: StyleDoc): Reference[] {
	const ids = [...new Set(s.pitfalls.flatMap((p) => p.claim.refs))];
	return ids.map((id) => {
		const r = getReference(id);
		if (!r) throw new Error(`${s.id}: unknown reference ${id}`);
		return r;
	});
}

/** Error messages for every problem in the style records; empty means valid. Used by the unit test. */
export function checkStyles(styles: Record<string, StyleDoc> = STYLES): string[] {
	const errors: string[] = [];
	for (const [key, s] of Object.entries(styles)) {
		const at = `style ${key}`;
		if (s.id !== key) errors.push(`${at}: id "${s.id}" does not match its key`);
		if (!(s.id in DESIGN_STYLES)) errors.push(`${at}: not a designStyle id`);
		if (s.origin.length < 2) errors.push(`${at}: origin needs at least two paragraphs`);
		for (const axis of TRAIT_AXES) {
			const t = s.traits[axis];
			if (!t?.summary.trim()) errors.push(`${at}: trait ${axis} is empty`);
			if (!t?.tokens.length) errors.push(`${at}: trait ${axis} names no token`);
		}
		if (s.dos.length < 3 || s.donts.length < 3)
			errors.push(`${at}: needs at least 3 dos and 3 don'ts`);
		if (!s.pitfalls.length) errors.push(`${at}: no accessibility pitfall`);
		if (!s.fits.length) errors.push(`${at}: no fitting component`);
		if (!s.limits.length) errors.push(`${at}: no limits`);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(s.reviewed)) errors.push(`${at}: reviewed is not YYYY-MM-DD`);
		for (const p of s.pitfalls) {
			const c = p.claim;
			const w = `${at}: pitfall "${p.title}"`;
			if (!p.fix.trim() || !c.text.trim()) errors.push(`${w}: fix or claim text is empty`);
			if (c.strength === "heuristic") {
				if (c.refs.length) errors.push(`${w}: a heuristic has no sources`);
			} else {
				if (!c.refs.length || !c.scope.trim()) errors.push(`${w}: needs refs and scope`);
				for (const id of c.refs) {
					const r = getReference(id);
					if (!r) errors.push(`${w}: unknown reference ${id}`);
					else if (r.verified.level !== "claim-read")
						errors.push(`${w}: reference ${id} was not read, no claim may rest on it`);
				}
			}
		}
		for (const id of s.atlas)
			if (!DESIGN_STYLES[s.id].taxonomy.includes(id))
				errors.push(`${at}: atlas ${id} is not in the recipe taxonomy`);
	}
	return errors;
}
