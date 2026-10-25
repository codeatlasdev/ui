// Scene registry: the `hero` of a post's frontmatter and the `scene` a section draws are keys of this map. Add a scene
// by writing `scenes/<Name>.astro` (a `<Scene>` in the 640-wide box, `.cs-*` classes only) and listing it here; the
// content tests fail on a key that is not listed, so a typo never ships a blank hero.
import DesignStyles from "./DesignStyles.astro";
import Evidence from "./Evidence.astro";
import GateBeforeAfter from "./GateBeforeAfter.astro";
import Generic from "./Generic.astro";
import Hero460 from "./Hero460.astro";
import InlineOverlays from "./InlineOverlays.astro";
import ItemViewer from "./ItemViewer.astro";
import ModalHover from "./ModalHover.astro";
import SoundEngine from "./SoundEngine.astro";
import TestPipeline from "./TestPipeline.astro";
import ThemeStudio from "./ThemeStudio.astro";
import UiIndex from "./UiIndex.astro";

export const SCENES = {
	generic: Generic,
	"hero-4-6-0": Hero460,
	"theme-studio": ThemeStudio,
	"ui-index": UiIndex,
	"item-viewer": ItemViewer,
	"design-styles": DesignStyles,
	evidence: Evidence,
	sound: SoundEngine,
	"inline-overlays": InlineOverlays,
	"modal-hover": ModalHover,
	"test-pipeline": TestPipeline,
	"gate-before-after": GateBeforeAfter,
} as const;

export type SceneId = keyof typeof SCENES;
export const isScene = (id: string): id is SceneId => id in SCENES;
