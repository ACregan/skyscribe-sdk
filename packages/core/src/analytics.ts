// Site Analytics: the Cloudflare Web Analytics beacon that lets a
// Publication's owner see visit figures for their SDK-driven website on
// SkyScribe's Insights tab. Cookie-free; SkyScribe reads the figures by
// hostname and shows them only once the site's Publication verification
// file (/.well-known/site.standard.publication) names the Publication.
//
// The token is SkyScribe's own and is public by design (it's in every
// page that loads the beacon). Keeping it here, rather than in each site's
// code, means SkyScribe can change how visits are collected in an SDK
// release.

export const SITE_ANALYTICS_SCRIPT_SRC = "https://static.cloudflareinsights.com/beacon.min.js";
const SITE_ANALYTICS_TOKEN = "02a51b1a213d484da7ec7accff28eaff";
const MARKER = "data-skyscribe-analytics";

export interface SiteAnalyticsScript {
  src: string;
  /** Attributes to put on the `<script>` element, as written in HTML. */
  attributes: { defer: true; "data-cf-beacon": string; [MARKER]: "" };
}

/** The beacon's `<script>` element, as data, for frameworks that render
 * head tags from objects (e.g. Nuxt's `useHead`). */
export function siteAnalyticsScript(): SiteAnalyticsScript {
  return {
    src: SITE_ANALYTICS_SCRIPT_SRC,
    // spa: count client-side navigations as page views too.
    attributes: { defer: true, "data-cf-beacon": JSON.stringify({ token: SITE_ANALYTICS_TOKEN, spa: true }), [MARKER]: "" },
  };
}

/** The beacon's `<script>` tag as HTML, for sites without a framework
 * adapter: paste it before `</body>` or into your HTML template. */
export function siteAnalyticsScriptTag(): string {
  const { src, attributes } = siteAnalyticsScript();
  const beacon = attributes["data-cf-beacon"].replace(/"/g, "&quot;");
  return `<script defer src="${src}" data-cf-beacon="${beacon}" ${MARKER}></script>`;
}

/** The parts of `document` that `loadSiteAnalytics` uses. */
export interface SiteAnalyticsDocument {
  querySelector(selector: string): unknown;
  createElement(tagName: "script"): {
    defer: boolean;
    src: string;
    setAttribute(name: string, value: string): void;
  };
  head: { appendChild(node: never): unknown };
}

/**
 * Adds the beacon to the page, once. Call it in the browser (it does
 * nothing without a `document`); calling it again, or on a page that
 * already has the tag from `siteAnalyticsScriptTag()`, does nothing. The
 * framework components call this for you.
 */
export function loadSiteAnalytics(
  doc: SiteAnalyticsDocument | undefined = (globalThis as { document?: SiteAnalyticsDocument }).document,
): void {
  if (!doc || doc.querySelector(`script[${MARKER}]`)) return;
  const { src, attributes } = siteAnalyticsScript();
  const script = doc.createElement("script");
  script.defer = true;
  script.src = src;
  script.setAttribute("data-cf-beacon", attributes["data-cf-beacon"]);
  script.setAttribute(MARKER, "");
  doc.head.appendChild(script as never);
}
