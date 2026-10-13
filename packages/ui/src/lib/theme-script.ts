import {
	defineTheme,
	fontPreloads,
	presetCSS,
	type ResolvedTheme,
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
 * (until the colorScheme store takes over) and replays runtime tokens.
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
var w=window,h=document.documentElement,ls=localStorage,R=${JSON.stringify(rt)};
w.__caTheme=R;
function g(k,ok,d){var r=ls.getItem(k),v;try{v=JSON.parse(r)}catch(e){}
  if(ok.indexOf(v)<0){if(r!==null)ls.removeItem(k);return d}return v}
var scheme=g('ca-scheme',${JSON.stringify(["light", "dark", "system"])},${JSON.stringify(t.defaultScheme)});
var preset=g('ca-preset',R.known,${JSON.stringify(t.defaultPreset)});
var style=g('ca-style',${JSON.stringify(["glass", "frosted", "solid", "flat"])},${JSON.stringify(t.defaultStyle)});
h.classList.add('ca-init');
h.setAttribute('data-preset',preset);
h.setAttribute('data-style',style);
h.setAttribute('data-ca-scheme',${JSON.stringify(t.defaultScheme)});
h.setAttribute('data-ca-style',${JSON.stringify(t.defaultStyle)});
var m=w.matchMedia('(prefers-color-scheme: dark)');
function a(){var d=scheme==='system'?m.matches:scheme==='dark';
  h.classList.toggle('dark',d);
  var e=document.querySelector('meta[name="theme-color"]');
  if(!e){e=document.createElement('meta');e.name='theme-color';document.head.appendChild(e)}
  e.content=R.colors[preset][d?1:0]}
a();
if(scheme==='system')m.addEventListener('change',function(){if(!h.hasAttribute('data-ca-live'))a()});
try{var x=JSON.parse(ls.getItem('ca-runtime-tokens')),c='';
  for(var k in x)if(/^--ca-[\\w-]+$/.test(k)&&!/[{}<;]/.test(x[k]))c+=k+':'+x[k]+';';
  if(c){var s=document.createElement('style');s.id='ca-runtime-tokens';s.textContent=':root{'+c+'}';document.head.appendChild(s)}
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
