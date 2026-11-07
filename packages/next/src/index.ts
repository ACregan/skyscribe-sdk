export { createScribePublication, createWellKnownHandler } from "./create-scribe-site.js";
export {
  documentMetadata,
  publicationMetadata,
  generateDocumentJsonLd,
  generatePublicationJsonLd,
  standardSiteLinks,
} from "./meta.js";
export type {
  StandardPublication,
  StandardDocument,
  Category,
  DocumentRef,
  DocumentContributor,
} from "@skyscribe-sdk/core";

// Deprecated names (ADR 0005): removed in the next major.
export { createScribeSite } from "./create-scribe-site.js";
export { articleMetadata, siteMetadata } from "./meta.js";
export type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/core";
