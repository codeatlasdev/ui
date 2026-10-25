import {
	defineTheme,
	fontPreloads,
	presetCSS,
	type ResolvedTheme,
	STYLES,
	type ThemeDefinition,
	themeCSS,
} from "./theme/define.js";

declare global {
	interface Window {
		/** Published by the theme init script. */
		__caTheme?: ThemeRuntime;
	}
}

/** Options for themeHead / caThemeHandle / caThemePlugin. */
export type ThemeOptions = Partial<ThemeDefinition>;

/** `id` of the inline theme-init `<script>`; used to detect that the theme is already injected. */
export const CA_THEME_MARKER = "ca-theme-init";

/** Shape of `window.__caTheme`, published by the init script for the colorScheme store. */
export interface ThemeRuntime {
	known: string[];
	/** preset id → [light, dark] theme-color hex */
	colors: Record<string, [string, string]>;
}

/**
 * Inline script that applies the stored (or default) scheme, preset and surface
 * style before any CSS/JS loads, so the page never flashes the wrong theme.
 * Stored values that are not valid for this theme are discarded. It also sets
 * `<meta name="theme-color">`, follows the OS scheme while `system` is active
 * (until the colorScheme store takes over) and replays runtime tokens. Those are written as
 * `:root:root:root{…}` (specificity 0,3,0): a brand preset's dark block is `.dark[data-preset]`
 * (0,2,0), so a plain `:root{…}` lost to it whatever the source order, and the tokens silently did
 * nothing in dark mode. Keep this in step with `RUNTIME_TOKENS_SELECTOR` in color-scheme.svelte.ts.
 *
 * Storage keys must stay in sync with color-scheme.svelte.ts.
 */
export function themeScript(options: ThemeOptions | ResolvedTheme = {}): string {
	const t = "known" in options ? options : defineTheme(options);
	const rt: ThemeRuntime = {
		known: t.known,
		colors: Object.fromEntries(
			Object.entries(t.themeColor).map(([id, c]) => [id, [c.light, c.dark]])
		),
	};
	return /* js */ `(function(){try{
var w=window,h=document.documentElement,ls=null,R=${JSON.stringify(rt)};
try{ls=w.localStorage}catch(e){}
w.__caTheme=R;
function rd(k){try{return ls.getItem(k)}catch(e){return null}}
function g(k,ok,d){var r=rd(k),v;try{v=JSON.parse(r)}catch(e){}
  if(ok.indexOf(v)<0){if(r!==null)try{ls.removeItem(k)}catch(e){}return d}return v}
var scheme=g('ca-scheme',${JSON.stringify(["light", "dark", "system"])},${JSON.stringify(t.defaultScheme)});
var preset=g('ca-preset',R.known,${JSON.stringify(t.defaultPreset)});
var style=g('ca-style',${JSON.stringify(STYLES)},${JSON.stringify(t.defaultStyle)});
h.classList.add('ca-init');
var isl=h.hasAttribute('data-ca-island');
if(isl){h.setAttribute('data-ca-app-preset',preset);preset=h.getAttribute('data-preset')||preset}
h.setAttribute('data-preset',preset);
h.setAttribute('data-style',style);
h.setAttribute('data-ca-scheme',${JSON.stringify(t.defaultScheme)});
h.setAttribute('data-ca-style',${JSON.stringify(t.defaultStyle)});
var m=w.matchMedia('(prefers-color-scheme: dark)');
function a(){var d=scheme==='system'?m.matches:scheme==='dark';
  if(isl){h.setAttribute('data-ca-app-dark',d?'1':'0');d=h.classList.contains('dark')}
  else h.classList.toggle('dark',d);
  var e=document.querySelector('meta[name="theme-color"]');
  if(!e){e=document.createElement('meta');e.name='theme-color';document.head.appendChild(e)}
  e.content=R.colors[preset][d?1:0]}
a();
if(scheme==='system')m.addEventListener('change',function(){if(!h.hasAttribute('data-ca-live'))a()});
try{var x=JSON.parse(rd('ca-runtime-tokens')),c='';
  for(var k in x)if(/^--ca-[\\w-]+$/.test(k)&&!/[{}<;]/.test(x[k]))c+=k+':'+x[k]+';';
  if(c){var s=document.createElement('style');s.id='ca-runtime-tokens';s.textContent=':root:root:root{'+c+'}';document.head.appendChild(s)}
}catch(e){}
requestAnimationFrame(function(){requestAnimationFrame(function(){h.classList.remove('ca-init')})});
}catch(e){}})();`;
}

/** Default script: amber preset, dark scheme, glass style. */
export const THEME_SCRIPT = themeScript();

/** CSS for one brand preset: the full token set plus the canvas-safe chart color. */
export function brandPresetCSS(preset: { id: string; color: string }): string {
	return presetCSS(preset as ThemeDefinition["presets"][number], "brand");
}

/**
 * Markup to place right after `<head>`: font preloads, theme CSS (brand presets,
 * fonts, structural tokens, overrides) and the init script. Used by caThemeHandle and caThemePlugin.
 */
export function themeHead(options: ThemeOptions = {}): string {
	const t = defineTheme(options);
	const css = themeCSS(t);
	const style = css ? `<style id="ca-theme">${css}</style>` : "";
	return `${fontPreloads(t)}${style}<script id="${CA_THEME_MARKER}">${themeScript(t)}</script>`;
}
