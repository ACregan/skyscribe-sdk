import { defineComponent, onMounted } from "vue";
import { loadSiteAnalytics } from "@skyscribe-sdk/core";

/**
 * Site Analytics for your SDK-driven website: adds SkyScribe's cookie-free
 * Cloudflare Web Analytics beacon, so the Publication's owner sees visit
 * figures on its Insights tab in SkyScribe. Render it once, e.g. in
 * App.vue. Figures only show once your site serves
 * `/.well-known/site.standard.publication`. Renders nothing itself.
 * (On Nuxt, `useSiteAnalytics()` from `@skyscribe-sdk/nuxt` puts the tag
 * in the server-rendered HTML instead.)
 */
export const SiteAnalytics = defineComponent({
  name: "SiteAnalytics",
  props: {
    /** Leave the beacon out, e.g. while developing behind a strict CSP.
     * Visits from local and preview hostnames never show in Insights
     * anyway. */
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    onMounted(() => {
      if (!props.disabled) loadSiteAnalytics();
    });
    return () => null;
  },
});
