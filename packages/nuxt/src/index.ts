export { default } from "./module.js";
export { documentSeoMeta, publicationSeoMeta } from "./composables/seoMeta.js";
// useSeoMeta() has no field for a canonical link, the site.standard link
// tags or structured data. Wire these into useHead() yourself:
//   useHead({
//     link: [
//       { rel: "canonical", href: buildCanonicalUrl(document, publication) },
//       ...standardSiteLinks(publication, document).map(({ rel, href }) => ({ rel, href })),
//     ],
//     script: [{ type: "application/ld+json", innerHTML: JSON.stringify(generateDocumentJsonLd(document, publication)) }],
//   })
export {
  buildCanonicalUrl,
  buildPublicationUrl,
  generateDocumentJsonLd,
  generatePublicationJsonLd,
  standardSiteLinks,
} from "@skyscribe-sdk/core";
export type {
  StandardPublication,
  StandardDocument,
  Category,
  DocumentRef,
  DocumentContributor,
} from "@skyscribe-sdk/core";

// Deprecated names (ADR 0005): removed in the next major.
export { articleSeoMeta, siteSeoMeta } from "./composables/seoMeta.js";
export { buildSiteUrl, generateArticleJsonLd, generateSiteJsonLd } from "@skyscribe-sdk/core";
export type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/core";
