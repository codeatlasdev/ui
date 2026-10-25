// Astro integration: the visitor's own theme, replayed before the first paint.
//
// Why an integration and not a `<script>` in the layout: Astro places every bundled `<style>` of a
// page (here 709 KB of inlined CSS) BEFORE the layout's own head markup, and only `injectScript
// ("head-inline")` lands ahead of it. A script after that stylesheet runs only once the browser has
// downloaded all of it; on a slow link the browser paints in between, and the visitor sees the
// published theme first (measured: first paint 14.7 s, theme applied 20 s, Slow 3G + 6x CPU).
//
// Two jobs, both synchronous and both reading only storage or the URL:
//  1. "Apply to site": the compiled CSS the studio stored under `ca-site-studio` goes into
//     `<style id="ca-site-studio">`, with `data-preset` and `data-style`. It is unlayered, so it wins
//     over the package's `@layer ca.*` CSS wherever it sits in the head: no re-append, no repaint.
//  2. Share URL: on the studio page, `#t=<code>` marks `<html data-ts-code>` and replays the preview
//     CSS the studio compiled for that very code on this browser (`ca-studio-island:<code>`). A code
//     never seen here has no compiled CSS yet (it needs the library): the preview stays invisible,
//     with its space reserved, until the studio has hydrated from the same code. The wrong theme is
//     never painted.
//
// `<ClientRouter />`: the swap replaces `<head>`, so the visitor style is copied onto the incoming
// document first (`astro:before-swap`), exactly as `caUI` does for its own style tags.
import type { AstroIntegration } from "astro";

/** Storage keys shared with `src/components/theme/apply-site.ts` and `ThemeStudio.svelte`. */
export const SITE_KEY = "ca-site-studio";
export const ISLAND_CACHE_PREFIX = "ca-studio-island:";

export const THEME_BOOT = /* js */ `(function(){try{
var d=document,h=d.documentElement,ls=localStorage;
function css(id,text){var s=d.getElementById(id);if(!s){s=d.createElement('style');s.id=id;d.head.appendChild(s)}s.textContent=text}
try{var t=JSON.parse(ls.getItem(${JSON.stringify(SITE_KEY)})||'null');
if(t&&t.v===1&&typeof t.css==='string'&&t.css){
  css(${JSON.stringify(SITE_KEY)},t.css);
  if(/^[\\w-]+$/.test(t.preset))h.setAttribute('data-preset',t.preset);
  if(/^[\\w-]+$/.test(t.style))h.setAttribute('data-style',t.style)}}catch(e){}
var m=/[#&]t=(v\\d+\\.[\\w-]+)/.exec(location.hash);
if(m&&location.pathname.indexOf('/theme/')===0){
  h.setAttribute('data-ts-code',m[1]);
  try{var c=ls.getItem(${JSON.stringify(ISLAND_CACHE_PREFIX)}+m[1]);if(c)css('ca-island-boot',c)}catch(e){}}
if(!window.__caSiteBoot){window.__caSiteBoot=1;
d.addEventListener('astro:before-swap',function(e){
  var n=e.newDocument,o=n.getElementById(${JSON.stringify(SITE_KEY)}),c=d.getElementById(${JSON.stringify(SITE_KEY)});
  if(o)o.remove();
  if(c)n.head.appendChild(c.cloneNode(true));
  ['data-preset','data-style'].forEach(function(a){var v=h.getAttribute(a);if(v!==null)n.documentElement.setAttribute(a,v)})})}
}catch(e){}})();`;

export function themeBoot(): AstroIntegration {
	return {
		name: "codeatlas-theme-boot",
		hooks: {
			"astro:config:setup": ({ injectScript }) => {
				injectScript("head-inline", THEME_BOOT);
			},
		},
	};
}
