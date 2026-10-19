import { useHead } from "#app";
import { siteAnalyticsScript } from "@skyscribe-sdk/core";

/**
 * Site Analytics for your SDK-driven website: puts SkyScribe's cookie-free
 * Cloudflare Web Analytics beacon in the page head (server-rendered), so
 * the Publication's owner sees visit figures on its Insights tab in
 * SkyScribe. Call it once, e.g. in app.vue. Figures only show once your
 * site serves `/.well-known/site.standard.publication`.
 */
export function useSiteAnalytics(options: { disabled?: boolean } = {}) {
  if (options.disabled) return;
  const { src, attributes } = siteAnalyticsScript();
  useHead({ script: [{ src, ...attributes, key: "skyscribe-site-analytics" }] });
}
