import { auditLayout } from "@codeatlasdev/ui/testing";
import type { Page } from "@playwright/test";

/**
 * Layout integrity on every prerendered page (desktop + mobile projects): the audit the package ships
 * (`auditLayout` from `@codeatlasdev/ui/testing`, #929), run in the page. One copy for the site and for apps.
 */
export const audit = (page: Page, isMobile: boolean): Promise<string[]> =>
	page.evaluate(auditLayout, { mobile: isMobile });
