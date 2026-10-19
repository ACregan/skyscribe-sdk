import { useEffect } from "react";
import { loadSiteAnalytics } from "@skyscribe-sdk/core";

type SiteAnalyticsProps = {
  /** Leave the beacon out, e.g. while developing behind a strict CSP.
   * Visits from local and preview hostnames never show in Insights
   * anyway, so you don't need this to keep them out of the figures. */
  disabled?: boolean;
};

/**
 * Site Analytics for your SDK-driven website: adds SkyScribe's cookie-free
 * Cloudflare Web Analytics beacon, so the Publication's owner sees visit
 * figures on its Insights tab in SkyScribe. Render it once, e.g. in your
 * root layout. Figures only show once your site serves
 * `/.well-known/site.standard.publication`. Renders nothing itself.
 */
export function SiteAnalytics({ disabled = false }: SiteAnalyticsProps) {
  // An effect rather than a rendered <script>: React doesn't run scripts
  // it creates on the client, so this works with or without SSR.
  useEffect(() => {
    if (!disabled) loadSiteAnalytics();
  }, [disabled]);
  return null;
}
